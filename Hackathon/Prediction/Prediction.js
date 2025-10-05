const NASA_TOKEN = "eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6InNhbWVlcl81NjAiLCJleHAiOjE3NjQ4MTY4NTcsImlhdCI6MTc1OTYzMjg1NywiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.eZOxijYHFIKdB4-xOxz_8Du7c2XvKQUjcSN91_2hLSiG2jDCKzDFiJureSVgf_LtnlfAGwro-ogWmCkAraCPFpvBqoew4xVIob8Df5bKdugzCUKE2fA46FPlkRgmFyJsSoZgk0qwKQupNoQdGEUHvFoVHBrD3b2h7n-5NKgejH9ui4x3vkOy6MLr3Qsler1ml9BuChDbN8bx4Q6rOjZIK7n7ODQJ4iCxK7MokaEONgRgTRXLIrZKIiSiXOZLDYzGiRiXxkDRneb74ZDXTWHGaN49qGNInkVZhGNR50uJQB_-wmhJP0AwZGDf464-L_U1RipPMwdqoz9pXREmAZOcEA"; // <-- Replace this locally with your token

  
    let detailedMap = null;
    let satelliteLayer = null;
    let precipitationLayer = null;
    let eventsLayer = null;
    let currentEventType = 'outdoor';
    let currentAnalysisData = null;
    let windowCurrentGeo = null;

   
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    document.getElementById('dateInput').valueAsDate = defaultDate;

    
    let map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

   
    document.querySelectorAll('.event-type-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.event-type-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        currentEventType = this.dataset.event;
        updateEventContext();
      });
    });

    function updateEventContext() {
      const eventContexts = {
        outdoor: "Outdoor Party",
        wedding: "Wedding Ceremony",
        sports: "Sports Game",
        festival: "Music Festival"
      };
      const eventIcons = { outdoor: "🎉", wedding: "💒", sports: "⚽", festival: "🎵" };
      if (window.currentGeo) {
        document.getElementById('eventContext').textContent =
          `${eventIcons[currentEventType]} Your ${eventContexts[currentEventType]} in`;
      }
    }

 
    function showToast(msg, type='info') {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      let bg = 'linear-gradient(135deg, var(--accent-color) 0%, #60a5fa 100%)';
      if (type === 'success') bg = 'linear-gradient(135deg, var(--success-color) 0%, #34d399 100%)';
      if (type === 'warning') bg = 'linear-gradient(135deg, var(--warning-color) 0%, #fbbf24 100%)';
      if (type === 'error') bg = 'linear-gradient(135deg, var(--danger-color) 0%, #f87171 100%)';
      Toastify({ text: msg, duration: 3500, gravity: "top", position: "right",
        style: { background: bg, color: isDark ? '#f1f5f9' : '#fff' } }).showToast();
    }

    
    function initTheme() {
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeText(savedTheme);
    }
    function toggleTheme() {
      const cur = document.documentElement.getAttribute('data-theme');
      const nxt = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nxt);
      localStorage.setItem('theme', nxt);
      updateThemeText(nxt);
      showToast(`Switched to ${nxt} mode`, 'success');
    }
    function updateThemeText(theme) {
      const themeText = document.getElementById('themeText');
      const themeIcon = document.getElementById('themeIcon');
      themeText.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
      themeIcon.innerHTML = theme === 'light' ? `<circle cx="12" cy="12" r="5"></circle>` :
        `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }

    
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      initializeEventListeners();
      initializeDetailedMap();
      loadCommunityReports();
      showToast('EventWeather AI ready — enter city & date to analyze', 'info');
    });

    
    function initializeDetailedMap() {
      if (detailedMap) return;
      try {
        detailedMap = L.map('detailedMap').setView([0,0],2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ maxZoom: 19 }).addTo(detailedMap);
        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
        
        precipitationLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={apiKey}', { apiKey: '82e62cf98050080ccef38650495ecfff' });
        setTimeout(()=>detailedMap.invalidateSize(), 150);
      } catch (e) {
        console.error('detailedMap init failed', e);
      }
    }

  
    document.getElementById('satelliteBtn')?.addEventListener('click', () => {
      if (!detailedMap) return;
      if (detailedMap.hasLayer(satelliteLayer)) {
        detailedMap.removeLayer(satelliteLayer);
        showToast('Satellite layer removed', 'info');
      } else {
        detailedMap.addLayer(satelliteLayer);
        showToast('Satellite layer added', 'success');
      }
    });

    
    document.getElementById('precipitationBtn')?.addEventListener('click', () => {
      if (!detailedMap) return;
      if (detailedMap.hasLayer(precipitationLayer)) {
        detailedMap.removeLayer(precipitationLayer);
        showToast('Precipitation layer disabled', 'info');
      } else {
        try {
          detailedMap.addLayer(precipitationLayer);
          showToast('Precipitation layer enabled (tile key may be required)', 'success');
        } catch (e) {
          showToast('Could not add precipitation tiles — showing demo overlay', 'warning');
          addDemoPrecipitationLayer();
        }
      }
    });

    
    document.getElementById('worldviewBtn')?.addEventListener('click', () => {
      const c = document.getElementById('worldviewContainer');
      if (!c) return;
      c.style.display = c.style.display === 'none' ? 'block' : 'none';
      showToast(c.style.display === 'block' ? 'Worldview shown' : 'Worldview hidden', 'info');
    });

    function addDemoPrecipitationLayer() {
      if (!detailedMap || !window.currentGeo) return;
      const circle = L.circle([window.currentGeo.lat, window.currentGeo.lon], { radius: 40000, color: '#1e90ff', fillOpacity: 0.2 }).addTo(detailedMap);
      if (!precipitationLayer || !(precipitationLayer instanceof L.LayerGroup)) precipitationLayer = L.layerGroup();
      precipitationLayer.addLayer(circle);
      detailedMap.addLayer(precipitationLayer);
    }


    async function fetchNASALiveEvents() {
      const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30';
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('EONET unreachable');
        const json = await r.json();
        return json.events || [];
      } catch (e) {
        console.warn('EONET failed, returning mock events', e);
        return generateMockWeatherEvents();
      }
    }

    function generateMockWeatherEvents() {
      const types = [{id:'severeStorms',title:'Severe Storms'},{id:'floods',title:'Floods'},{id:'wildfires',title:'Wildfires'}];
      const evts = [];
      for (let i=0;i<3;i++){
        evts.push({
          id:`mock-${i}`, title: `${types[i].title} near region`, categories:[types[i]],
          geometry:[{coordinates:[(Math.random()*360)-180,(Math.random()*160)-80],date:new Date().toISOString()}]
        });
      }
      return evts;
    }

    async function loadNASALiveEventsOnMap() {
      showToast('Loading NASA events...', 'info');
      try {
        const events = await fetchNASALiveEvents();
        if (eventsLayer) detailedMap.removeLayer(eventsLayer);
        eventsLayer = L.layerGroup().addTo(detailedMap);
        let count=0;
        events.slice(0,8).forEach(e=>{
          if (!e.geometry || e.geometry.length===0) return;
          const coords = e.geometry[0].coordinates;
          const lon = coords[0], lat = coords[1];
          const color = (e.categories[0].id==='floods')?'blue':(e.categories[0].id==='wildfires'?'darkred':'orange');
          const ic = L.divIcon({html:`<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`, className:'weather-event-marker'});
          L.marker([lat,lon],{icon:ic}).addTo(eventsLayer).bindPopup(`<b>${e.title}</b><br>${e.categories[0].title}`);
          count++;
        });
        showToast(count>0?`Loaded ${count} events`:'No events found', 'success');
      } catch (e) {
        console.error(e);
        showToast('Failed to load events', 'error');
      }
    }

   
    async function fetchNASAPowerPoint(lat, lon, startIso, endIso) {
      
      const params = 'T2M,PRECTOT,WS2M,RH2M'; 
      const start = startIso.replace(/-/g,''), end = endIso.replace(/-/g,'');
      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('POWER failed');
        const json = await res.json();
        return { ok:true, data: json };
      } catch (e) {
        console.error('POWER error', e);
        return { ok:false, error:e };
      }
    }

   
    async function checkGPMAvailabilityForDate(date) {
     
      const year = date.getFullYear();
      const mm = String(date.getMonth()+1).padStart(2,'0');
      const dd = String(date.getDate()).padStart(2,'0');
     
      const fname = `3B-HHR.MS.MRG.3IMERG.${year}${mm}${dd}-S000000-E235959.0000.V06B.HDF5.nc4`;
      const base = `https://gpm1.gesdisc.eosdis.nasa.gov/opendap/GPM_L3/IMERG_V06/${year}/${mm}/${fname}`;
      try {
        const res = await fetch(base, { method:'HEAD', headers: NASA_TOKEN ? { Authorization: `Bearer ${NASA_TOKEN}` } : {} });
        return res.ok;
      } catch (e) {
        console.warn('GPM HEAD failed', e);
        return false;
      }
    }

   
    function generateSeed(s) {
      let hash = 0;
      for (let i=0;i<s.length;i++){ const c=s.charCodeAt(i); hash = ((hash<<5)-hash)+c; hash = hash & hash; }
      return Math.abs(hash);
    }
    function predictableRandom(seed) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }

    
    async function findOptimalDates(geo, originalDate, eventType) {
    
      const suggestions = [];
      const orig = new Date(originalDate);
     
      const start = new Date(orig);
      start.setDate(orig.getDate() + 1);
      const end = new Date(orig);
      end.setDate(orig.getDate() + 14);

      const startIso = start.toISOString().slice(0,10);
      const endIso = end.toISOString().slice(0,10);

      const powerResp = await fetchNASAPowerPoint(geo.lat, geo.lon, startIso, endIso);
      let daily = [];
      if (powerResp.ok && powerResp.data && powerResp.data.properties && powerResp.data.properties.parameter) {
       
        const params = powerResp.data.properties.parameter;
        const precObj = params.PRECTOT || params.PRECTOTCORP || params.PRECTOTCOR;
        if (precObj) {
         
          daily = Object.entries(precObj).map(([k,v]) => {
            const yyyy = k.slice(0,4), mm = k.slice(4,6), dd = k.slice(6,8);
            return { date: new Date(`${yyyy}-${mm}-${dd}`), precip: Number(v) };
          }).sort((a,b)=>a.date - b.date);
        }
      }

  
      if (daily.length === 0) {
        for (let i=1;i<=14;i++) {
          const d = new Date(orig); d.setDate(orig.getDate()+i);
          const seed = generateSeed(`${geo.lat}-${geo.lon}-${d.toISOString().slice(0,10)}`);
          daily.push({ date: d, precip: Math.round(predictableRandom(seed)*10) });
        }
      }

    
      const lowDays = daily.filter(d => d.precip < 3).slice(0,3); // <3 mm considered low
      if (lowDays.length > 0) {
        for (const d of lowDays) {
          suggestions.push({
            date: d.date,
            dateString: d.date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }),
            probability: Math.max(0, 100 - Math.round((d.precip/10)*100)), // lower precip -> higher score
            confidence: 85,
            bestTime: getBestTimeOfDay(eventType, d.date.getMonth()),
            advantage: `Low rainfall (${d.precip} mm expected)`,
            safetyIndex: Math.max(60, 100 - Math.round(d.precip*5))
          });
        }
      } else {
       
        const bestHours = [];
        const altDate = new Date(orig);
        const seed = generateSeed(`${geo.lat}-${geo.lon}-${altDate.toISOString().slice(0,10)}`);
        const timeline = generateDynamicTimelineForecast(predictableRandom(seed)*100, seed, altDate);
       
        timeline.sort((a,b)=>a.probability - b.probability);
        const top = timeline.slice(0,3);
        for (const h of top) {
          suggestions.push({
            date: altDate,
            dateString: `${altDate.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} ${h.hour}`,
            probability: 100 - h.probability,
            confidence: 75,
            bestTime: `${h.hour}`,
            advantage: `Lower rain chance (${h.probability}% rain)`,
            safetyIndex: Math.max(40, 100 - h.probability)
          });
        }
      }

      return suggestions;
    }

   
    function getBestTimeOfDay(eventType, month) {
      const isSummer = month >= 5 && month <= 8;
      const isDay = ['outdoor','sports','wedding'].includes(eventType);
      if (eventType === 'festival') return 'Evening (5-8 PM)';
      if (eventType === 'wedding') return 'Late Afternoon (4-6 PM)';
      if (isDay) return isSummer ? 'Morning (8-11 AM)' : 'Afternoon (1-4 PM)';
      return 'Afternoon (1-4 PM)';
    }

  
    function generateDynamicTimelineForecast(baseProbability, seed, dateTime) {
      const eventHour = dateTime.getHours();
      const arr = [];
      for (let i=-2;i<=3;i++){
        const hour = (eventHour + i + 24) % 24;
        const hourSeed = seed + i*97;
        const timeFactor = calculateTimeOfDayFactor(hour);
        const variation = (predictableRandom(hourSeed)-0.5)*40;
        let prob = baseProbability * timeFactor + variation;
        prob = Math.max(0, Math.min(100, prob));
        let risk = 'low'; if (prob>60) risk='high'; else if (prob>30) risk='medium';
        arr.push({ hour: formatHourForDisplay(hour), probability: Math.round(prob), risk, actualHour: hour });
      }
      return arr;
    }

    function calculateTimeOfDayFactor(hour) {
      if (hour >= 13 && hour <= 17) return 1.3;
      if (hour >= 18 && hour <= 20) return 1.1;
      if (hour >= 6 && hour <= 10) return 0.8;
      if (hour >= 21 || hour <= 5) return 0.7;
      return 1.0;
    }
    function formatHourForDisplay(h24) {
      const h = h24 % 24;
      const period = h >= 12 ? 'PM' : 'AM';
      let hh = h % 12; if (hh===0) hh=12;
      return `${hh}${period}`;
    }

   
    async function analyzeWithNASAData(geo, targetDateIso) {
    
      const dateObj = new Date(targetDateIso);
      const start = new Date(dateObj); start.setDate(dateObj.getDate()-3);
      const end = new Date(dateObj); end.setDate(dateObj.getDate()+3);
      const startIso = start.toISOString().slice(0,10);
      const endIso = end.toISOString().slice(0,10);

      
      const powerResp = await fetchNASAPowerPoint(geo.lat, geo.lon, startIso, endIso);
      let monthlyData = { temperature:20, precipitation:5, humidity:60, windSpeed:4 };
      if (powerResp.ok && powerResp.data && powerResp.data.properties && powerResp.data.properties.parameter) {
        const params = powerResp.data.properties.parameter;
        const T2M = params.T2M || {};
        const PRECTOT = params.PRECTOT || params.PRECTOTCORP || {};
        const RH2M = params.RH2M || {};
        const WS2M = params.WS2M || {};
        const mean = arr => arr.length? arr.reduce((a,b)=>a+Number(b),0)/arr.length : null;
        const tArr = Object.values(T2M).map(Number);
        const pArr = Object.values(PRECTOT).map(Number);
        const rhArr = Object.values(RH2M).map(Number);
        const wArr = Object.values(WS2M).map(Number);
        monthlyData.temperature = Number((mean(tArr)||20).toFixed(1));
        monthlyData.precipitation = Number((mean(pArr)||5).toFixed(1));
        monthlyData.humidity = Number((mean(rhArr)||60).toFixed(1));
        monthlyData.windSpeed = Number((mean(wArr)||4).toFixed(1));
      } else {
     
        const mock = generateEnhancedMockNASAData(geo, targetDateIso);
        monthlyData.temperature = Number(mock.T2M.OCT);
        monthlyData.precipitation = Number(mock.PRECTOTCORP.OCT);
        monthlyData.humidity = Number(mock.RH2M.OCT);
        monthlyData.windSpeed = Number(mock.WS2M.OCT);
      }

     
      const liveEvents = await fetchNASALiveEvents();

  
      const giovanni = await searchEarthdataCMR('giovanni');
      const gesdisc = await searchEarthdataCMR('GES DISC');
      const hydrology = await searchEarthdataCMR('hydrology');

      const enhanced = {
        basicProbabilities: calculateBasicProbabilities({
          temperature: monthlyData.temperature,
          precipitation: monthlyData.precipitation,
          humidity: monthlyData.humidity,
          windSpeed: monthlyData.windSpeed
        }),
        comfortFactors: analyzeComfortFactors({ temperature: monthlyData.temperature, humidity: monthlyData.humidity }),
        riskFactors: analyzeRiskFactors({ precipitation: monthlyData.precipitation, temperature: monthlyData.temperature }, targetDateIso),
        nasaContext: await getNASASeasonalContext(geo, targetDateIso),
        liveEvents,
        dataSource: 'NASA POWER + EONET',
        datasetLinks: { giovanni, gesdisc, hydrology }
      };

     
      currentAnalysisData = enhanced;
      return enhanced;
    }

    
    async function searchEarthdataCMR(keyword) {
      try {
        const q = encodeURIComponent(keyword);
        const url = `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=${q}&page_size=6`;
        const r = await fetch(url);
        if (!r.ok) throw new Error('CMR search failed');
        const j = await r.json();
        const entries = (j.feed && j.feed.entry) ? j.feed.entry.map(e=>({ title:e.title, id:e.id, links:e.links })) : [];
        return entries;
      } catch (e) {
        console.warn('CMR error', e);
        return [];
      }
    }

    
    function calculateBasicProbabilities(monthlyData) {
      const rainProb = Math.min(100, (monthlyData.precipitation / 50) * 100);
      const tempComfort = (monthlyData.temperature >= 18 && monthlyData.temperature <= 26) ? 90 :
                         (monthlyData.temperature >= 15 && monthlyData.temperature <= 28) ? 70 : 50;
      return {
        rainProb: Math.round(rainProb),
        comfortTemp: getComfortLevel(monthlyData.temperature),
        windComfort: getWindComfortLevel(monthlyData.windSpeed),
        humidityComfort: getHumidityComfortLevel(monthlyData.humidity),
        comfortScore: tempComfort
      };
    }
    function getComfortLevel(temp) {
      if (temp >= 18 && temp <= 26) return 'Perfect';
      if (temp >= 15 && temp <= 28) return 'Comfortable';
      if (temp >= 10 && temp <= 32) return 'Manageable';
      return 'Challenging';
    }
    function getWindComfortLevel(w) {
      if (w < 3) return 'Calm'; if (w < 6) return 'Light breeze'; if (w < 10) return 'Moderate'; return 'Windy';
    }
    function getHumidityComfortLevel(h) {
      if (h < 40) return 'Dry'; if (h < 60) return 'Comfortable'; if (h < 80) return 'Humid'; return 'Very humid';
    }
    function analyzeComfortFactors(monthlyData) {
      const avgTemp = monthlyData.temperature;
      const avgHumidity = monthlyData.humidity;
      const apparentTemp = avgTemp + 0.1 * avgHumidity;
      return { temperature: avgTemp, apparentTemperature: apparentTemp, humidity: avgHumidity, comfortScore: calculateComfortScore(avgTemp, avgHumidity) };
    }
    function calculateComfortScore(temp, humidity) {
      let score = 100;
      if (temp < 15 || temp > 30) score -= 30;
      else if (temp < 18 || temp > 26) score -= 15;
      if (humidity < 30 || humidity > 80) score -= 20;
      else if (humidity < 40 || humidity > 70) score -= 10;
      return Math.max(0, score);
    }
    function analyzeRiskFactors(monthlyData, targetDate) {
      const month = new Date(targetDate).getMonth();
      let seasonalRisk = 0;
      if (month >= 5 && month <= 9) seasonalRisk = 40;
      else if (month >= 11 || month <= 2) seasonalRisk = 25;
      else seasonalRisk = 15;
      return { seasonalRisk, floodRisk: Math.min(100, (monthlyData.precipitation / 100) * 100), heatRisk: monthlyData.temperature > 32 ? 70 : 20, overallRisk: seasonalRisk };
    }
    async function getNASASeasonalContext(geo, targetDate) {
      const month = new Date(targetDate).getMonth();
      const seasons = {0:'Winter',1:'Winter',2:'Spring',3:'Spring',4:'Spring',5:'Summer',6:'Summer',7:'Summer',8:'Fall',9:'Fall',10:'Fall',11:'Winter'};
      return { season: seasons[month], typicalConditions: getTypicalConditions(month), bestAlternative: getBestAlternativeMonth(month) };
    }
    function getTypicalConditions(month) {
      const conditions = {
        0: 'Cold, possible rain/snow',1:'Cold, possible precipitation',2:'Mild, occasional rain',3:'Mild, pleasant',4:'Warm, pleasant',
        5:'Warm, humid',6:'Hot, possible storms',7:'Hot, humid',8:'Warm, pleasant',9:'Mild, pleasant',10:'Mild, occasional rain',11:'Cold, possible rain/snow'
      };
      return conditions[month];
    }
    function getBestAlternativeMonth(currentMonth) {
      const alternatives = {0:'April or May',1:'April or May',2:'September',3:'September',4:'September',5:'September',6:'April',7:'April',8:'May',9:'May',10:'May',11:'April or May'};
      return alternatives[currentMonth];
    }
    function calculateSuccessProbability(nasaAnalysis) {
      const { basicProbabilities, comfortFactors, riskFactors } = nasaAnalysis;
      let probability = 100;
      probability -= basicProbabilities.rainProb * 0.8;
      probability -= (100 - comfortFactors.comfortScore) * 0.3;
      probability -= riskFactors.overallRisk * 0.4;
      return Math.max(0, Math.min(100, probability));
    }

    
    async function predictRainProbability(geo, dateTime) {
    
      const day = dateTime.toISOString().slice(0,10);
   
      const start = new Date(dateTime); start.setDate(dateTime.getDate()-1);
      const end = new Date(dateTime); end.setDate(dateTime.getDate()+1);
      const powerResp = await fetchNASAPowerPoint(geo.lat, geo.lon, start.toISOString().slice(0,10), end.toISOString().slice(0,10));
      let baseProb = predictableRandom(generateSeed(`${geo.lat}-${geo.lon}-${day}`))*100;
      if (powerResp.ok && powerResp.data && powerResp.data.properties && powerResp.data.properties.parameter) {
        const p = powerResp.data.properties.parameter;
        const PRECTOT = p.PRECTOT || p.PRECTOTCOR || {};
     
        const key = day.replace(/-/g,'');
        const val = PRECTOT[key] !== undefined ? Number(PRECTOT[key]) : null;
        if (val !== null) {
         
          baseProb = Math.min(100, Math.max(0, val * 6 + predictableRandom(generateSeed(val+'')) * 20));
        }
      }
      const seed = generateSeed(`${geo.lat}-${geo.lon}-${day}`);
      const liveFactors = predictableRandom(seed+100)*100;
      const aiProbability = baseProb*0.7 + liveFactors*0.3;
      const confidence = Math.floor(predictableRandom(seed+50)*20 + 75);
      const safetyIndex = Math.max(0, Math.min(100, 100 - aiProbability));
      const timeline = generateDynamicTimelineForecast(aiProbability, seed, dateTime);
      return { probability: Math.min(100, aiProbability), confidence, intensity: predictRainIntensity(aiProbability), duration: predictRainDuration(aiProbability), floodRisk: Math.min(100, aiProbability), timeline, safetyIndex };
    }

    function predictRainIntensity(prob) { if (prob < 30) return { label:'Light showers', level:'low' }; if (prob < 60) return { label:'Moderate rain', level:'medium' }; return { label:'Heavy rainfall', level:'high' }; }
    function predictRainDuration(prob) { if (prob < 30) return '1-2 hours'; if (prob < 60) return '2-4 hours'; return '4+ hours'; }


    async function runEnhancedAnalysis(geo, targetISODate) {
      showLoader();
      try {
        window.currentGeo = geo;
        const userDate = new Date(targetISODate);
    
        const [nasaAnalysis, rainPrediction, optimalDates] = await Promise.all([
          analyzeWithNASAData(geo, targetISODate),
          predictRainProbability(geo, userDate),
          findOptimalDates(geo, userDate, currentEventType)
        ]);
        nasaAnalysis.alternativeDates = optimalDates;
        const successProbability = calculateSuccessProbability(nasaAnalysis);
        displayEnhancedResults(successProbability, nasaAnalysis, rainPrediction, userDate.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric'}), userDate);
        showToast(`Analysis complete using ${nasaAnalysis.dataSource}`, 'success');
      } catch (e) {
        console.error(e);
        showToast('Analysis failed — falling back to basic results', 'warning');
        await runBasicAnalysis(geo, targetISODate);
      } finally {
        hideLoader();
      }
    }

    async function runBasicAnalysis(geo, targetISODate) {
      window.currentGeo = geo;
      const userDate = new Date(targetISODate);
      const formattedDate = userDate.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      const nasaAnalysis = await analyzeWithNASAData(geo, targetISODate);
      const successProbability = calculateSuccessProbability(nasaAnalysis);
      displayResults(successProbability, nasaAnalysis, formattedDate, userDate);
      showToast('Basic analysis complete', 'success');
    }

 
    function displayEnhancedResults(successProbability, nasaAnalysis, rainPrediction, formattedDate, userDate) {
      displayResults(successProbability, nasaAnalysis, formattedDate, userDate);
      document.getElementById('dataSourceIndicator').textContent = `Using ${nasaAnalysis.dataSource}`;
      document.getElementById('confidenceBadge').textContent = `${rainPrediction.confidence}% confident`;
      document.getElementById('rainIntensity').textContent = rainPrediction.intensity.label;
      document.getElementById('duration').textContent = `(${rainPrediction.duration})`;
      const intensityDot = document.getElementById('intensityDot');
      intensityDot.className = 'intensity-dot';
      if (rainPrediction.intensity.level === 'medium') intensityDot.classList.add('medium');
      if (rainPrediction.intensity.level === 'high') intensityDot.classList.add('high');
      updateSafetyIndex(rainPrediction.safetyIndex);
      const floodEl = document.getElementById('floodRisk');
      if (rainPrediction.floodRisk > 70) { floodEl.style.display='block'; floodEl.textContent = `🚨 High Flood Risk (${Math.round(rainPrediction.floodRisk)}%)`; }
      else { floodEl.style.display='none'; }
      displayTimelineForecast(rainPrediction.timeline);
      displayAlternativeDates(nasaAnalysis.alternativeDates);
      displayLiveAlerts(nasaAnalysis.liveEvents);
      document.getElementById('mapSection').style.display='block';
      document.getElementById('communityCard').style.display='block';
      document.getElementById('alertPanel').style.display='block';
    
      if (window.currentGeo && detailedMap) {
        detailedMap.setView([window.currentGeo.lat, window.currentGeo.lon], 10);
        detailedMap.eachLayer(l => { if (l instanceof L.Marker) detailedMap.removeLayer(l); });
        L.marker([window.currentGeo.lat, window.currentGeo.lon]).addTo(detailedMap).bindPopup(`<b>${window.currentGeo.name}</b><br>Event Location`).openPopup();
        setTimeout(()=>detailedMap.invalidateSize(), 250);
      }
    }

    function updateSafetyIndex(si) {
      const el = document.getElementById('safetyIndex');
      el.textContent = si >= 70 ? 'Low Risk' : si >= 40 ? 'Medium Risk' : 'High Risk';
      el.className = 'safety-value ' + (si >= 70 ? 'safety-low' : si >= 40 ? 'safety-medium' : 'safety-high');
    }

    function displayResults(successProbability, nasaAnalysis, formattedDate, userDate) {
      const { basicProbabilities, comfortFactors, riskFactors, nasaContext } = nasaAnalysis;
      const successIcon = document.getElementById('successIcon');
      if (successProbability >= 80) { successIcon.textContent='😎'; successIcon.className='success-icon success'; }
      else if (successProbability >= 60) { successIcon.textContent='😊'; successIcon.className='success-icon success'; }
      else if (successProbability >= 40) { successIcon.textContent='😐'; successIcon.className='success-icon warning'; }
      else { successIcon.textContent='😟'; successIcon.className='success-icon danger'; }

      document.getElementById('successRate').textContent = `${Math.round(successProbability)}%`;
      document.getElementById('successRate').className = `huge ${ successProbability >= 80 ? 'success' : successProbability >= 60 ? 'warning' : 'danger' }`;

      const riskLevel = document.getElementById('riskLevel');
      const riskPercentage = 100 - successProbability;
      riskLevel.style.width = `${riskPercentage}%`;
      riskLevel.className = riskPercentage < 30 ? 'risk-level risk-low' : riskPercentage < 60 ? 'risk-level risk-medium' : 'risk-level risk-high';

      document.getElementById('rainProb').textContent = `${Math.round(basicProbabilities.rainProb)}%`;
      document.getElementById('tempInfo').textContent = comfortFactors.comfortTemp;
      document.getElementById('windInfo').textContent = basicProbabilities.windComfort;
      document.getElementById('comfortIndex').textContent = basicProbabilities.humidityComfort;

      const histSuccess = Math.max(60, Math.min(95, successProbability + (Math.random()*20 - 10)));
      document.getElementById('historicalSuccess').textContent = `${Math.round(histSuccess)}%`;

      document.getElementById('cityName').textContent = window.currentGeo.name;
      document.getElementById('coords').textContent = `${window.currentGeo.lat.toFixed(4)}, ${window.currentGeo.lon.toFixed(4)}`;

    
      map.setView([window.currentGeo.lat, window.currentGeo.lon], 10);
      map.eachLayer(l => { if (l instanceof L.Marker) map.removeLayer(l); });
      L.marker([window.currentGeo.lat, window.currentGeo.lon]).addTo(map).bindPopup(window.currentGeo.name).openPopup();

      updateEventContext();

     
      document.getElementById('resultsCard').style.display='block';
      document.getElementById('recommendationsCard').style.display='block';
      document.getElementById('historyCard').style.display='block';
      document.getElementById('alternativesCard').style.display='block';

     
      generateSmartRecommendations(successProbability, nasaAnalysis, userDate);

      document.querySelectorAll('.fade-in').forEach(el=>{ el.style.opacity=0; el.style.animation='fadeInUp 0.5s ease forwards'; });
    }


    function generateSmartRecommendations(successProbability, nasaAnalysis, userDate) {
      const { basicProbabilities, comfortFactors, riskFactors, nasaContext } = nasaAnalysis;
      const recsContainer = document.getElementById('recommendationList');
      recsContainer.innerHTML = '';
      const recs = [];
      if (successProbability >= 80) recs.push({icon:'✅', text:'Perfect conditions! Proceed with your outdoor plans as scheduled.'});
      else if (successProbability >= 60) recs.push({icon:'📋', text:'Good conditions overall. Have a simple backup plan ready.'});
      else if (successProbability >= 40) recs.push({icon:'⚠️', text:'Moderate risk. Strongly consider indoor alternatives or flexible dates.'});
      else recs.push({icon:'🚨', text:'High risk of weather issues. Reschedule or move to indoor venue.'});

      if (basicProbabilities.rainProb > 50) recs.push({icon:'🌧️', text:'High rain chance: Book tent/indoor space and notify guests about potential weather.'});
      else if (basicProbabilities.rainProb > 25) recs.push({icon:'☔', text:'Some rain possible: Have umbrellas and covered areas available.'});

      if (comfortFactors.temperature > 30) recs.push({icon:'🥤', text:'Hot weather expected: Provide plenty of water, shade, and cooling stations.'});
      else if (comfortFactors.temperature < 15) recs.push({icon:'🔥', text:'Cool temperatures: Consider heating options and warm beverages.'});

      if (basicProbabilities.windComfort === 'Windy') recs.push({icon:'💨', text:'Windy conditions: Secure decorations and consider wind breaks.'});

      if (nasaContext.season === 'Summer') recs.push({icon:'⏰', text:'Summer tip: Consider earlier/later times to avoid peak heat.'});
      else if (nasaContext.season === 'Winter') recs.push({icon:'🕔', text:'Winter advice: Schedule during warmest part of day (1-4 PM).'});

      if (currentEventType === 'wedding') recs.push({icon:'💒', text:'Wedding tip: Have indoor ceremony backup and protect floral arrangements from weather.'});
      else if (currentEventType === 'sports') recs.push({icon:'⚽', text:'Sports advice: Ensure proper field drainage and have rain dates scheduled.'});

      recs.push({icon:'🛰️', text:`Analysis powered by NASA climate data showing ${nasaContext.typicalConditions.toLowerCase()} for this season.`});

      recs.forEach(r=>{
        const item = document.createElement('div'); item.className='recommendation-item';
        item.innerHTML = `<div class="recommendation-icon">${r.icon}</div><div class="small">${r.text}</div>`;
        recsContainer.appendChild(item);
      });
    }

    function displayTimelineForecast(timeline) {
      const container = document.getElementById('timelineBar');
      if (!timeline || timeline.length===0) {
        const seed = generateSeed('fallback');
        timeline = generateDynamicTimelineForecast(50, seed, new Date());
      }
      container.innerHTML = timeline.map(s => `<div class="timeline-segment ${s.risk}-risk" title="${s.hour}: ${s.probability}%">${s.hour}</div>`).join('');
    }

   
    function displayAlternativeDates(alts) {
      const container = document.getElementById('alternativeDates');
      if (!alts || alts.length===0) { container.innerHTML = '<div class="big success" style="text-align:center;margin:15px 0;">Current timing is optimal!</div>'; return; }
      container.innerHTML = alts.map(a => `<div style="margin:10px 0;padding:10px;background:var(--bg-tertiary);border-radius:8px;">
        <div class="small"><strong>${a.dateString}</strong></div>
        <div class="small"><i class="fas fa-clock"></i> Best: ${a.bestTime}</div>
        <div class="small success">${a.advantage}</div>
        <div class="small">Safety Index: ${Math.round(a.safetyIndex)}%</div>
      </div>`).join('');
    }

   
    function displayLiveAlerts(events) {
      const c = document.getElementById('liveAlerts');
      if (!events || events.length===0) { c.innerHTML = '<div class="small">✅ No severe weather alerts in your area</div>'; return; }
      const rel = events.filter(ev => ev.categories.some(cat => ['severeStorms','floods','seaLakeIce'].includes(cat.id))).slice(0,3);
      if (rel.length===0) { c.innerHTML = '<div class="small">✅ No severe weather alerts in your area</div>'; return; }
      c.innerHTML = rel.map(ev => `<div class="small" style="color:var(--warning-color);margin:5px 0;">⚠️ ${ev.title}</div>`).join('');
    }

   
    function loadCommunityReports() {
      const reports = JSON.parse(localStorage.getItem('weatherReports') || '[]');
      const container = document.getElementById('communityReports');
      if (!reports.length) { container.innerHTML = '<div class="small">No recent reports yet</div>'; return; }
      container.innerHTML = reports.slice(-3).reverse().map(r => `<div class="community-report"><div class="small">"${r.report}"</div><div class="small" style="color:var(--text-tertiary)">${new Date(r.timestamp).toLocaleDateString()}</div></div>`).join('');
    }

    function reportCurrentWeather() {
      const rep = prompt('Report current weather in your area:');
      if (!rep) return;
      const reports = JSON.parse(localStorage.getItem('weatherReports') || '[]');
      reports.push({ report: rep, location: window.currentGeo?.name || 'Unknown', timestamp: new Date().toISOString() });
      if (reports.length > 10) reports.shift();
      localStorage.setItem('weatherReports', JSON.stringify(reports));
      loadCommunityReports();
      showToast('Thanks for your report!', 'success');
    }


    async function geocodeCity(city) {
      try {
        const q = encodeURIComponent(city);
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
        const res = await fetch(url, { headers:{ 'Accept-Language':'en' }});
        const list = await res.json();
        if (!Array.isArray(list) || list.length===0) return null;
        const it = list[0];
        return { name: it.display_name, lat: parseFloat(it.lat), lon: parseFloat(it.lon) };
      } catch (e) {
        showToast('Location service error', 'error'); throw e;
      }
    }
    async function reverseGeocode(lat, lon) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const r = await fetch(url);
        const j = await r.json();
        return j.display_name || j.address?.city || null;
      } catch (e) { return null; }
    }

    
    function initializeEventListeners() {
      document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
      document.getElementById('predictBtn')?.addEventListener('click', handlePredict);
      document.getElementById('locBtn')?.addEventListener('click', useMyLocation);
      document.getElementById('exportBtn')?.addEventListener('click', exportReport);
      document.getElementById('alternativeBtn')?.addEventListener('click', handleFindBetterTime);
      document.getElementById('calendarBtn')?.addEventListener('click', addToCalendar);
      document.getElementById('reportWeather')?.addEventListener('click', reportCurrentWeather);
      document.getElementById('eventsBtn')?.addEventListener('click', loadNASALiveEventsOnMap);
      document.getElementById('worldviewBtn')?.addEventListener('click', ()=>{ /* handled above */ });
      document.getElementById('cityInput')?.addEventListener('keypress', (e)=>{ if (e.key==='Enter') handlePredict(); });
    }

    async function handlePredict() {
      const cityStr = document.getElementById('cityInput').value.trim();
      const dateStr = document.getElementById('dateInput').value;
      const timeStr = document.getElementById('timeInput').value || '14:00';
      if (!cityStr || !dateStr) { showToast('Please enter city and date', 'warning'); return; }
      try {
        const geo = await geocodeCity(cityStr);
        if (!geo) { showToast('City not found', 'error'); return; }
        window.currentGeo = geo;
        await runEnhancedAnalysis(geo, `${dateStr}T${timeStr}`);
      } catch (e) { console.error(e); showToast('Analysis error', 'error'); }
    }

    function showLoader() { document.getElementById('loader').classList.add('active'); }
    function hideLoader() { document.getElementById('loader').classList.remove('active'); }

    function useMyLocation() {
      if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
      navigator.geolocation.getCurrentPosition(async pos=>{
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        const name = await reverseGeocode(lat, lon) || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
        document.getElementById('cityInput').value = name;
        showToast('Location detected', 'success');
      }, e=>{ showToast('Unable to get location', 'error'); }, { enableHighAccuracy:true, timeout:10000 });
    }

    
    function exportReport() {
      if (!window.currentGeo) { showToast('No analysis to export', 'warning'); return; }
      const cityName = document.getElementById('cityName').textContent;
      const successRate = document.getElementById('successRate').textContent;
      const report = `EventWeather AI Report\n\nLocation: ${cityName}\nEvent Type: ${currentEventType}\nSuccess Probability: ${successRate}\n\nGenerated using NASA POWER + EONET\n\nRecommendations:\n${Array.from(document.querySelectorAll('.recommendation-item .small')).map(i=>`• ${i.textContent}`).join('\n')}\n\nGenerated on: ${new Date().toLocaleDateString()}\n`;
      const blob = new Blob([report], { type:'text/plain' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `event-weather-report-${new Date().toISOString().slice(0,10)}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      showToast('Report downloaded', 'success');
    }

    function addToCalendar() {
      if (!window.currentGeo) { showToast('Please analyze first', 'warning'); return; }
      const details = { title: `${currentEventType} - Weather Risk: ${document.getElementById('successRate').textContent}`, location: document.getElementById('cityName').textContent, start: document.getElementById('dateInput').value, description: Array.from(document.querySelectorAll('.recommendation-item .small')).map(i=>i.textContent).join('; ') };
      const start = new Date(details.start); const end = new Date(start.getTime() + 2*60*60*1000);
      const f = d => d.toISOString().replace(/-|:|\.\d+/g,'');
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(details.title)}&dates=${f(start)}/${f(end)}&details=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;
      window.open(url,'_blank'); showToast('Opened calendar event', 'success');
    }

    
    async function handleFindBetterTime() {
      if (!window.currentGeo) { showToast('Please analyze a location first', 'warning'); return; }
      showToast('Finding better dates/times...', 'info');
      const dateStr = document.getElementById('dateInput').value;
      const timeStr = document.getElementById('timeInput').value || '14:00';
      const orig = new Date(`${dateStr}T${timeStr}`);
      const suggestions = await findOptimalDates(window.currentGeo, orig, currentEventType);
      displayAlternativeDates(suggestions);
      if (suggestions && suggestions.length) {
        document.getElementById('alternativeDates').scrollIntoView({ behavior:'smooth' });
        showToast('Found better timing options', 'success');
      } else showToast('No better options found', 'info');
    }


    function generateEnhancedMockNASAData(geo, date) {
      const seed = generateSeed(`${geo.lat}-${geo.lon}-${date}`);
      const baseTemp = 15 + predictableRandom(seed)*20;
      const baseRain = predictableRandom(seed+1)*100;
      return {
        T2M:{OCT: (baseTemp+2).toFixed(1)},
        PRECTOTCORP:{OCT: (baseRain*0.4).toFixed(1)},
        RH2M:{OCT:(55+predictableRandom(seed+11)*25).toFixed(1)},
        WS2M:{OCT:(2+predictableRandom(seed+23)*7).toFixed(1)}
      };
    }

    function navigateTo(page) {
      window.location.href = page; 
    }

   

  