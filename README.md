#  ClimaXplorer

###  Project Overview
*ClimaXplorer* is a next-gen weather exploration app that visualises *current* and *upcoming weather conditions* using *NASA’s APIs*.  
This project is built to help both *common users* and *weather experts* understand detailed atmospheric data in an engaging, interactive, and visually stunning way.

---

##  Motive
> “To express the current and upcoming weather condition on the behalf of the API given by NASA.”

ClimaXplorer focuses on *providing detailed weather insights* for a specific location selected or searched by the user.  
With seamless *UI/UX, beautiful **visualisations, and **real-time weather data*, the project ensures:
- Delightful user experience 
- Graphical representation of climate data 
- Analytical details for professionals and researchers   

---

##  Main Page
The main page comes alive with *2D animations* and *aqua lightning effects*, ensuring users stay engaged while browsing.  
Key highlights:
- Minimal distractions for smooth navigation   
- Highlighted buttons and readable text for accessibility  
- Aesthetic yet functional weather visuals  

---

##  Climate Predictions for Special Occasions
ClimaXplorer provides *future climate predictions* using *historical data* and *mathematical analysis*.  

### APIs Used:
-  *NASA POWER API* → for historical and environmental data  
- 🛰 *NASA GIBS API* → for satellite imagery and graphical weather representation  
- ☁ *OpenWeather API* → for real-time weather updates  

- *GES DISC OPeNDAP (Hyrax)* → Provides global hydrology and climate data Used for rainfall intensity & atmospheric moisture

- *Giovanni Portal* → Data visualization and analytics tool Source for temperature and humidity dataset patterns

- *Data Rods for Hydrology* → Provides time-series for specific hydrological variables Used to calculate flood and drought indices  
           
- *Worldview (NASA EOSDIS)* → Satellite imagery viewer Embedded map to visualize live cloud/rain overlays

- *Earthdata Search* → Access to multiple Earth observation datasets Used to retrieve multi-variable climate records via API 


### Use Case:
Predicts and analyses weather conditions for special events like:
-  Festivals  
-  Weddings  
-  Sports  
-  Picnics  
-  Parades  

This is the *core feature* of ClimaXplorer — where *math meets meteorology*   

---

## 💻 Technologies Used
- *API Integration* → (NASA POWER, GIPS, GES DISC OPeNDAP (Hyrax) and OpenWeather APIs)  
- *Dynamic Rendering* → Real-time weather data and graphs  
- *Mathematical Analysis* → For future climate predictions  
- *Real-Time Updates* → Without page reloads  
- *Interactive UI/UX* → With animations and transitions  

---

## 🧩 Architecture Overview
```text
Frontend     → HTML, CSS, JavaScript (Interactive UI)
Backend/API  → NASA POWER, GIPS, OpenWeather APIs
Data Layer   → JSON formatted weather data
Visuals      → Animated and graphical displays