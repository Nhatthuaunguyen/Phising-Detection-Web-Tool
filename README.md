# Installation Guide

## 1. Project Directory Structure
Phising-Detection-Web-Tool/
├── backend/ # Flask Python Backend API
│ ├── app.py # Main server and endpoints (/analyze, /analyze-deep)
│ ├── ml_model.py # Feature extraction and ML prediction loader
│ ├── llm_analyzer.py # Gemini API integration & logo/content crawlers
│ ├── scoring.py # Weighting engine & configuration manager
│ ├── requirements.txt # Python dependencies
│ └── models/ # model_training_ml.pkl
│ ├── evaluation/ # Evaluate fast path system, full path system
├── plugin/ # Chrome Extension (Manifest V3)
│ ├── manifest.json # Extension permissions and configurations
│ ├── background.js # Service worker intercepting web requests
│ ├── checks.js # API connection client & offline fallback heuristics
│ └── warning.html/js/css # Redirection warning screen
├── mobileAppDetection/ # React Native Expo Mobile App
│ ├── App.js # Main application UI and scanner views
│ ├── package.json # Node dependencies & Expo scripts
│ └── assets/ # Icons and splash images
└── colab_notebooks/ # Training scripts & datasets
├── machine_learning_integration.ipynb # Notebook used to train model in Google colab
└── model_feature_config.json # Configuration list of ML features

## 2. Prerequisites & Development Environment
To run the full suite locally, you will need the following tools installed on your development
machine:
Node.js Version 18.0.0 or higher ([Download Node.js](https://nodejs.org/))
Python: Version 3.9 to 3.12 ([Download Python](https://www.python.org/))
Google Chrome: Needed to test the browser extension unpacked.
Expo Go: To run the mobile app, install Expo Go on

## 3. Step-by-Step Setup Guide
### 3.1. Set Up and Run the Backend Server
The backend runs on Python Flask. It is preconfigured with a trained ML model and a default
pool of Gemini API keys for development.
Step 1: Initialize the Virtual Environment
Navigate to the root directory of the project and activate the virtual environment (`venv` is
already included in the repository structure).
● On Windows (PowerShell):
If venv is not initialized, run:
python -m venv venv
.\venv\Scripts\Activate.ps1
● On Windows (Command Prompt):
.\venv\Scripts\activate.bat
● On macOS/Linux (In bash):
source venv/bin/activate

Step 2: Install Python Dependencies
In terminal:
cd backend
pip install -r requirements.txt
Step 3: Training model
In colab notebook folder, upload file machine_learning_integration.ipynb into google colab
Run each cell to train the data. Then, the result of the best-performing and most accurate list
of input feature names is generated and saved as a file model_training_ml.pkl for download
and put into the folder /backend/models/machine_learning_result to use in the backend.
Upload file evaluation_ml_layer.ipynb to google colab. Run each cell and import file
model_training_ml.pkl to perform evaluation of the machine learning layer and find the best
threshold of the machine learning layer. After that, extract the evaluation into file
feature_config.json, model_feature_config.json, scoring_config.json and put it into the folder
/backend/models/machine_learning_result to use in the backend.

Step 4: Run machine learning layer in the backend, perform evaluate fast path and find
the grey zone for perform LLM
To run the machine learning layer in the backend, run:
Terminal:
cd backend
py ml_model.py
To evaluate the fast path and compare metrics first 4 layers:
Terminal:
cd backend\evaluation
py evaluate_fast_path.py
To find the grey zone for trigger LLM, run:
Terminal:
cd backend\evaluation
py find_optimal_threshold.py
Step 5: Configure API Keys (Optional)
Open [backend/llm_analyzer.py](file:/backend/llm_analyzer.py) to inspect or modify the
Gemini API keys. The system uses a fallback rotation mechanism.
How to create google api key:
Open the Google api key website: https://aistudio.google.com/app/apikey
Choose tab 'API Keys'
Click button 'Create API key'
Name the key, Choose an imported project - create new project
Click create key
Click copy key and paste your own Gemini API keys directly into the `API_KEYS` list:
API_KEYS = [
"YOUR_GEMINI_API_KEY_1",
"YOUR_GEMINI_API_KEY_2",
]
After input api key, run
Terminal:
cd backend
py llm_analyzer.py

Step 6: Find the final score (deep path score)
After prepare all layers, run
cd backend
py scoring.py
Step 7: Evaluate 5 layers
run:
cd backend\evaluation
py evaluate_deep_path_full.py
Step 8: Start the Backend Server
Run the Flask application at backend direction:
terminal:
py app.py
The server will boot up locally at: http://127.0.0.1:5000
To verify it is active, open `http://127.0.0.1:5000/` in your browser. You should see a JSON
payload listing the status as `"running"` and confirming the ML model is loaded.

### 3.2. Load the Chrome Extension (Plugin)
The Chrome extension monitors your active browser tabs and blocks unsafe websites by
communicating with the backend.
1. Open Google Chrome.
2. Navigate to the extensions page by typing chrome://extensions/ in the URL bar.
3. Enable Developer mode using the toggle switch in the upper-right corner.
4. Click the Load unpacked button in the top-left corner.
5. In the file explorer popup, select the plugin directory from this repository.
6. The extension is now active!

How to Test:
Ensure the Python Backend is running.
Try opening a domain in Chrome. If the backend classifies it as malicious (e.g.
`http://fake-login-bank.net`), you will be immediately redirected to the built-in warning page
(`warning.html`) showing the safety breakdown score.

### 3.3. Run the Mobile Application (Expo)
The mobile app provides a search-bar scanner, deep-link intercept simulation, and local
fallback heuristics.

Step 1: Install Node Dependencies
Navigate into the mobile project folder and run `npm install`:
bash
cd mobileAppDetection
npm install
Step 2: Configure the Backend API Connection
By default, the mobile app points to `http://127.0.0.1:5000/analyze` in
[mobileAppDetection/App.js]
Step 3: Start the Expo Metro Bundler
Start the development server:
bash
npm start or npx expo start
› Press a │ open Android
› Press w │ open web
› Press r │ reload app
Step 4: Testing: Once all components are running, you can test the phishing detection engine
by pressing a or w

## 4. Testing
### 4.1. Chrome Extension Test
Open a browser tab and navigate to: http://phish-update-secure.com
● At the UI:
blocked instantly
● At the backend:
Show fast path score, LLM score, final score, status, warning reason.
Click 'Open' to access the link. Click 'Go back' to navigate back to the default state
Open a browser tab and navigate to: https://www.youtube.com

● At the UI:
allow to access immediately
● At the backend:
Show fast path score, final score, status.
Click 'Open' to access the link. Click 'Go back' to navigate back to the default state

### 4.2. Mobile App Test
1. Open the app simulation or the web version (press a or w)
2. Type any URL (such as http://phish-update-secure.com
, https://www.youtube.com) in the top search box and tap Check to see the popup result
3. The pop up result must be a safe or unsafe URL with reason. Two buttons 'Open', which
allow user to access the link or 'Go back' to navigate back to the default state
