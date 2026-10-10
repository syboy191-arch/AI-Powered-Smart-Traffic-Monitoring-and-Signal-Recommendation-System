package backend.validation;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

@Component
public class VideoValidator {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "mp4", "mov", "avi", "mkv", "webm"
    );

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new ValidationException("EMPTY_FILE", "Uploaded file is empty", HttpStatus.BAD_REQUEST);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ValidationException(
                "UNSUPPORTED_FORMAT",
                "Unsupported file format. Allowed extensions: mp4, mov, avi, mkv, webm",
                HttpStatus.BAD_REQUEST
            );
        }

        byte[] header = new byte[64];
        int bytesRead;
        try (InputStream is = file.getInputStream()) {
            bytesRead = is.read(header);
        } catch (IOException e) {
            throw new ValidationException("INVALID_VIDEO", "Unable to read video file header", HttpStatus.BAD_REQUEST);
        }

        if (bytesRead < 8 || !isValidVideoMagicBytes(header, bytesRead)) {
            throw new ValidationException("INVALID_VIDEO", "File header does not match valid video format", HttpStatus.BAD_REQUEST);
        }
    }

    public static String extractExtension(String filename) {
        if (filename == null) {
            return null;
        }
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return null;
        }
        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    public static boolean isValidVideoMagicBytes(byte[] header, int length) {
        if (header == null || length < 4) {
            return false;
        }

        // MKV / WebM: EBML header 0x1A 0x45 0xDF 0xA3
        if ((header[0] & 0xFF) == 0x1A && (header[1] & 0xFF) == 0x45 &&
            (header[2] & 0xFF) == 0xDF && (header[3] & 0xFF) == 0xA3) {
            return true;
        }

        // AVI: Starts with 'RIFF' and at offset 8 has 'AVI ' or 'AVIX'
        if (length >= 12 &&
            header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F' &&
            header[8] == 'A' && header[9] == 'V' && header[10] == 'I') {
            return true;
        }

        // MP4 / MOV: ISO BMFF box header: 4-byte size + 4-byte box type
        if (length >= 8) {
            String boxType = new String(header, 4, 4, StandardCharsets.US_ASCII);
            if ("ftyp".equals(boxType) || "moov".equals(boxType) || "mdat".equals(boxType) ||
                "wide".equals(boxType) || "free".equals(boxType) || "skip".equals(boxType)) {
                return true;
            }
        }

        // Check if 'ftyp' is within first 32 bytes
        for (int i = 0; i <= Math.min(length - 4, 32); i++) {
            if (header[i] == 'f' && header[i+1] == 't' && header[i+2] == 'y' && header[i+3] == 'p') {
                return true;
            }
        }

        return false;
    }
}
