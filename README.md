# 🫁 Respiratory Screener - AI-Powered Cough Analysis

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://respiratoryscreener.netlify.app/)
[![Backend API](https://img.shields.io/badge/API-HuggingFace-yellow)](https://huggingface.co/spaces/Kalpokoch/respiratory-symptom-api)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An AI-powered web application that analyzes cough audio recordings to detect respiratory symptoms including Persistent Cough, Cold/Runny Nose, Fever, and Fatigue using deep learning techniques.

> **⚠️ Medical Disclaimer**: This application is for educational and research purposes only. It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical concerns.

## 🌐 Live Demo

- **Frontend**: [respiratoryscreener.netlify.app](https://respiratoryscreener.netlify.app/)
- **Backend API**: [HuggingFace Spaces](https://huggingface.co/spaces/Kalpokoch/respiratory-symptom-api)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Model Details](#model-details)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Dataset](#dataset)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)
- [Citation](#citation)

## ✨ Features

### 🎤 Dual Input Methods
- **File Upload**: Drag-and-drop or browse audio files (WAV, MP3, FLAC, OGG)
- **Live Recording**: Record cough samples directly in the browser using Web Audio API

### 🔍 Multi-Label Symptom Detection
The model analyzes audio and provides probability scores for:
- 🤧 Persistent Cough
- 🤒 Cold/Runny Nose
- 🌡️ Fever
- 😴 Fatigue

### ⚡ Performance Features
- Real-time audio processing and analysis
- Fast inference with CPU-optimized deployment
- Responsive, mobile-friendly interface
- Interactive results visualization

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Key Technologies**:
  - Web Audio API for real-time recording
  - Drag-and-drop file handling
  - Responsive UI design
  - Real-time prediction visualization

### Backend Stack
- **Framework**: FastAPI
- **Deployment**: HuggingFace Spaces (CPU optimized)
- **Audio Processing**: 
  - Sample Rate: 22,050 Hz
  - Fixed Duration: 10 seconds
  - Feature Extraction: 128-bin Mel-spectrograms

### Model Architecture
```
Input: Audio Waveform (10s @ 22.05kHz)
  ↓
Mel-Spectrogram Transform (128 bins)
  ↓
4x Convolutional Blocks
├── Conv2D + BatchNorm + ReLU + MaxPool
├── Dropout (0.5)
└── Progressive channel expansion
  ↓
Shared Feature Extraction Layer
  ↓
4x Symptom-Specific Prediction Heads
├── Persistent Cough
├── Cold/Runny Nose
├── Fever
└── Fatigue
  ↓
Output: Multi-label Probabilities
```

**Model Specifications**:
- Total Parameters: ~1.27M
- Optimization: CPU inference optimized
- Architecture: Lightweight CNN with multi-head classification

## 🔬 Model Details

### Training Configuration
- **Dataset**: Coswara COVID-19 respiratory sounds dataset
- **Validation Strategy**: 5-fold stratified cross-validation
- **Optimizer**: AdamW (lr=0.0001, weight_decay=0.01)
- **Loss Function**: Custom multi-label loss with:
  - Focal loss for class imbalance
  - Dynamic class weighting
  - Label smoothing (0.1)
- **Regularization**: 
  - Dropout: 0.5
  - L2 weight decay: 0.01

### Data Augmentation
- **SpecAugment**: Time/frequency masking
- **Mixup**: α=0.4, probability=0.2
- **Time Stretching & Pitch Shifting**

### Training Infrastructure
- **Hardware**: NVIDIA Tesla T4 GPU (Kaggle)
- **Training Time**: 1-3 hours per fold
- **Early Stopping**: Patience of 8 epochs
- **LR Scheduling**: ReduceLROnPlateau

## 📊 Performance

| Metric | Score |
|--------|-------|
| F1-Macro (Avg) | 39-41% |
| Cross-Validation | 5-fold |
| Inference Time | <1s per sample |

*Note: Performance metrics are based on self-reported symptom labels from the Coswara dataset.*

## 🛠️ Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Web Audio API
- CSS3 with responsive design

### Backend
- Python 3.10+
- FastAPI
- PyTorch
- librosa (audio processing)
- NumPy

### Deployment
- Frontend: Netlify
- Backend: HuggingFace Spaces

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.10+
- Git

## 🚀 Usage

### Web Application
1. Visit [respiratoryscreener.netlify.app](https://respiratoryscreener.netlify.app/)
2. Choose input method:
   - **Upload**: Click or drag audio file
   - **Record**: Click microphone button and record cough
3. Wait for analysis (typically <1 second)
4. Review probability scores for each symptom

### API Usage

```python
import requests

# Upload audio file
url = "https://huggingface.co/spaces/Kalpokoch/respiratory-symptom-api/api/predict"
files = {"file": open("cough_sample.wav", "rb")}
response = requests.post(url, files=files)

# Get predictions
predictions = response.json()
print(predictions)
```

## 📚 Dataset

This project uses the **Coswara Dataset**, a crowdsourced collection of respiratory sounds:

- **Source**: Indian Institute of Science (IISc), Bangalore
- **Size**: 5,000+ audio samples
- **Labels**: Self-reported symptoms (fever, cold, fatigue, cough)
- **Format**: Various audio formats (WAV, MP3, etc.)

### Citation
If you use this dataset or project, please cite:

```bibtex
@article{sharma2020coswara,
  title={Coswara--A Database of Breathing, Cough, and Voice Sounds for COVID-19 Diagnosis},
  author={Sharma, Neeraj and others},
  journal={arXiv preprint arXiv:2005.10548},
  year={2020}
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [respiratoryscreener.netlify.app](https://respiratoryscreener.netlify.app/)
- **Backend API**: [HuggingFace Spaces](https://huggingface.co/spaces/Kalpokoch/respiratory-symptom-api)
- **Coswara Dataset**: [GitHub](https://github.com/iiscleap/Coswara-Data)

## 📧 Contact

For questions, suggestions, or collaborations:
- Open an issue in this repository
- Connect via GitHub

## 🙏 Acknowledgments

- Indian Institute of Science (IISc) for the Coswara dataset
- HuggingFace for hosting infrastructure
- Open-source community for various libraries and tools

---

**⭐ If you find this project useful, please consider giving it a star!**