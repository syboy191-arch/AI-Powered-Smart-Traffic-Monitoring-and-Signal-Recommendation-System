package backend;

import backend.validation.ValidationException;
import backend.validation.VideoValidator;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class VideoValidatorTest {

    private final VideoValidator validator = new VideoValidator();

    @Test
    void testEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile("video", "test.mp4", "video/mp4", new byte[0]);
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(emptyFile));
        assertEquals("EMPTY_FILE", ex.getCode());
    }

    @Test
    void testUnsupportedFormat() {
        MockMultipartFile txtFile = new MockMultipartFile("video", "test.txt", "text/plain", "some text content".getBytes());
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(txtFile));
        assertEquals("UNSUPPORTED_FORMAT", ex.getCode());
    }

    @Test
    void testInvalidMagicBytesForMp4() {
        byte[] fakeBytes = "This is not a real mp4 video file at all".getBytes();
        MockMultipartFile corruptFile = new MockMultipartFile("video", "corrupt.mp4", "video/mp4", fakeBytes);
        ValidationException ex = assertThrows(ValidationException.class, () -> validator.validate(corruptFile));
        assertEquals("INVALID_VIDEO", ex.getCode());
    }

    @Test
    void testValidMp4Header() {
        // MP4 header: 4 bytes length + "ftyp" + 4 bytes brand
        byte[] mp4Header = new byte[]{0x00, 0x00, 0x00, 0x18, 'f', 't', 'y', 'p', 'm', 'p', '4', '2', 0, 0, 0, 0};
        MockMultipartFile validMp4 = new MockMultipartFile("video", "valid.mp4", "video/mp4", mp4Header);
        assertDoesNotThrow(() -> validator.validate(validMp4));
    }

    @Test
    void testValidAviHeader() {
        // AVI header: 'RIFF' + 4 bytes size + 'AVI '
        byte[] aviHeader = new byte[]{'R', 'I', 'F', 'F', 0x20, 0x00, 0x00, 0x00, 'A', 'V', 'I', ' ', 0, 0, 0, 0};
        MockMultipartFile validAvi = new MockMultipartFile("video", "valid.avi", "video/x-msvideo", aviHeader);
        assertDoesNotThrow(() -> validator.validate(validAvi));
    }

    @Test
    void testValidMkvHeader() {
        // MKV header: 0x1A 0x45 0xDF 0xA3 + padding
        byte[] mkvHeader = new byte[]{(byte) 0x1A, 0x45, (byte) 0xDF, (byte) 0xA3, 0x01, 0x00, 0x00, 0x00, 0, 0, 0, 0};
        MockMultipartFile validMkv = new MockMultipartFile("video", "valid.mkv", "video/x-matroska", mkvHeader);
        assertDoesNotThrow(() -> validator.validate(validMkv));
    }
}
