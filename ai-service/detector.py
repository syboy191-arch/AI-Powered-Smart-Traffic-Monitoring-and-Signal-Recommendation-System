from ultralytics import YOLO
import os

print("Current folder:", os.getcwd())
print("Video exists:", os.path.exists("videos/traffic.mp4"))  

model = YOLO("ai-service/models/yolov8n.pt")  

results = model.predict(
    source="videos/traffic.mp4",  
    save=True,
    conf=0.4
)

vehicle_classes = {
    "car": 0,
    "motorcycle": 0,
    "bus": 0,
    "truck": 0
}

for result in results:
    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]

        if class_name in vehicle_classes:
            vehicle_classes[class_name] += 1

print("\n===== VEHICLE COUNT =====")

total = 0

for vehicle, count in vehicle_classes.items():
    print(f"{vehicle}: {count}")
    total += count

print(f"\nTotal Vehicles: {total}")

if total < 20:
    density = "LOW"
elif total < 50:
    density = "MEDIUM"
else:
    density = "HIGH"

print(f"Traffic Density: {density}")

print("Detection completed!")

import json

traffic_data = {
    "cars": vehicle_classes["car"],
    "motorcycles": vehicle_classes["motorcycle"],
    "buses": vehicle_classes["bus"],
    "trucks": vehicle_classes["truck"],
    "density": density
}

with open("traffic_data.json", "w") as f:
    json.dump(traffic_data, f, indent=4)

print("traffic_data.json created")

import json

data = {
    "cars": vehicle_classes["car"],
    "motorcycles": vehicle_classes["motorcycle"],
    "buses": vehicle_classes["bus"],
    "trucks": vehicle_classes["truck"],
    "density": density
}

with open("traffic_data.json", "w") as f:
    json.dump(data, f)