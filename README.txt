 AI-Powered Smart Traffic Monitoring and Signal Recommendation System

 Team
 Nerdvana squad

 Problem Statement

Urban traffic congestion remains a major challenge in Bengaluru. While AI-based camera systems already detect traffic violations, 
congestion management and adaptive signal control remain critical challenges.

Solution

This project uses YOLOv8 object detection to identify and count vehicles from traffic video feeds. 
Vehicle counts are analyzed to determine traffic density levels (LOW, MEDIUM, HIGH).
Based on density, the system generates recommendations for traffic signal management.

 Technologies Used

* Python
* YOLOv8
* OpenCV
* Spring Boot
* HTML
* CSS
* JavaScript
* Chart.js

 Features

* Vehicle detection using YOLOv8
* Real-time vehicle counting
* Traffic density classification
* REST API backend
* Interactive dashboard
* AI-based traffic recommendations

 Future Scope

* Adaptive traffic signal control
* Traffic violation detection
* Emergency vehicle prioritization
* Multi-camera traffic analysis


Machine Learning Component:
YOLOv8 (Ultralytics) object detection model is used for vehicle detection and traffic density analysis.


 Installation and Execution

 Prerequisites

* Java 21
* Maven
* Python 3.x
* YOLOv8 (Ultralytics)
* VS Code

 Install Python Dependencies

bash
pip install ultralytics
pip install opencv-python
pip install flask
pip install numpy


 Run Vehicle Detection

bash
python ai-service/detector.py


This generates `traffic_data.json` containing vehicle counts and traffic density information.

 Start Spring Boot Backend

bash
cd backend
mvn spring-boot:run


Open Dashboard

Open:

text
dashboard/index.html


using Live Server in VS Code.

Backend API:

text
http://localhost:8080/traffic/status


Project Workflow

Traffic Video
→ YOLOv8 Detection
→ Vehicle Counting
→ Traffic Density Classification
→ JSON Output
→ Spring Boot API
→ Dashboard Visualization
→ AI Recommendation
