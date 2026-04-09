# Phising-Detection-Web-Tool

implementation plan

# Comprehensive Hybrid Phishing Detection System

This document outlines the implementation plan to build out the full phishing detection system requested. We will expand the existing basic backend and extension, and introduce a new React Native mobile app, advanced analysis layers, Machine Learning, and LLM integrations.

## User Review Required

> [!WARNING]
> Before we proceed, please review the proposed architecture and integration choices. Specifically, we will need access to API keys for any real Threat Intelligence feeds (like Google Safe Browsing) and LLM models (e.g., Google Gemini or OpenAI) to integrate into the local backend.

> [!IMPORTANT]
> Based on your feedback, **Model Training (Phase 3) and Evaluation/Testing (Phases 5 & 6) will be designed for Google Colab**. We will prepare Jupyter Notebook (`.ipynb`) scripts for you to run in Colab. Once training and evaluation are complete, you will simply download the exported model (e.g., `.pkl`) and insert it into the local backend to run the system.

## Proposed Changes

---

### Phase 1: Client-Side Applications (Interceptors & UI)

**Web Extension (Desktop)**
- Upgrade the existing Chrome extension to seamlessly block suspicious navigation events using Manifest V3's `chrome.webNavigation` API.
- Create a modern, aesthetic `warning.html` and `warning.css` with a detailed explanation of why the URL was blocked.
- Implement "Proceed anyway" and "Back to safe page" functionalities.

**Mobile Application (React Native)**
- Initialize a new React Native project. The mobile application demo will be run and tested locally using the Android Studio emulator.
- Design an aesthetic, native-feeling Warning Modal (equivalent to the web warning page).
- Implement logical stubs for handling OS-level intents (e.g., handling incoming URLs from text messages or other apps).

#### [MODIFY] `plugin/background.js`
#### [MODIFY] `plugin/warning.html`
#### [MODIFY] `plugin/warning.css`
#### [NEW] `mobile_app/` (React Native project structure)

---

### Phase 2 & 4: Core Detection Engine & Scoring Logic 

**Backend Expansion**
- Restructure `backend/app.py` into a modular package or utilize FastAPI for better async support.
- Implement rule-based algorithms (Typo-squatting, structural checks).
- Integrate a Threat Intelligence layer (Querying against a local denylist or public APIs).
- Add Domain WHOIS and SSL Certificate parsing.
- Introduce dynamic analysis using Playwright to render headless instances of the URL and extract redirection chains/metadata.
- Update Scoring weights based on the 40-50 point threshold criteria.
- **Model Loader:** Add functionality to load the Colab-trained model (`.pkl`) to run real-time inference on incoming URLs.

#### [MODIFY] `backend/app.py`
#### [NEW] `backend/analyzer/rules.py`
#### [NEW] `backend/analyzer/threat_intel.py`
#### [NEW] `backend/analyzer/domain_ssl.py`
#### [NEW] `backend/analyzer/dynamic_sandbox.py`

---

### Phase 3: Machine Learning & LLM Integration (Colab & Local)

**Machine Learning (Google Colab)**
- We will create a Jupyter Notebook for you to upload to Colab. It will train a Random Forest / XGBoost model using your `malicious_url_dataset` and export the resulting `.pkl` file.

**LLM Enabler (Local Backend)**
- Use an LLM API (like Google Gemini) to analyze extracted Logos, Metadata, and Page content.
- Take snapshots of the rendered page using the Python Sandbox, extract the logo/favicon, and pass them to the Vision LLM for identity matching.

#### [NEW] `colab_notebooks/1_model_training.ipynb`
#### [NEW] `backend/models/llm_prompts.py`

---

### Phase 5 & 6: Evaluation & Testing Framework (Colab)

- We will provide a second Jupyter Notebook for Evaluation.
- You can upload your custom collected dataset, along with standard sources (PhishTank, Tranco, Alexa) to Colab, and run the notebook to measure False Positives, False Negatives, Precision, Recall, and Accuracy.
- The notebook will output performance reports and matplotlib charts (ROC curves, bar charts) evaluating thresholds from 10 to 100 (e.g. 10, 20, 30... 100).

#### [NEW] `colab_notebooks/2_evaluation_and_testing.ipynb`

## Open Questions

> [!NOTE]
> 1. Do you have specific API keys you'd like to use for the LLM (e.g., OpenAI API Key, Google Gemini API Key) and Threat Intelligence (e.g., Google SafeBrowsing API Key)? If not, I can create mock functions or use free/open alternatives where possible.
> 2. Does your current local environment support running headless browsers (Playwright) or should I use a pure request-based HTTP parsing fallback?

## Verification Plan

### Automated Tests (Colab)
- Run `colab_notebooks/2_evaluation_and_testing.ipynb` in Google Colab to generate all your accuracy graphs and charts based on the dataset.

### Manual Verification (Local)
- Place the trained `model.pkl` in the local backend directory.
- Boot up the Local Backend, Web Extension, and Mobile App.
- Navigate to a known tricky phishing domain visually identical to a real one.
- Verify that the warning intercept UI pops up, tells us *why* it's blocked, and that the base API correctly logs the breakdown from all layers (Rules, ML, LLM).
