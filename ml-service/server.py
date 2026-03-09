from pathlib import Path
import joblib
from fastapi import FastAPI
from pydantic import BaseModel

from train_model import train_and_save


MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "crowd_model.joblib"


def load_model():
    if not MODEL_PATH.exists():
        train_and_save()
    return joblib.load(MODEL_PATH)


model = load_model()
app = FastAPI(title="Temple Crowd ML Service", version="1.0.0")


class PredictionInput(BaseModel):
    temple_code: int
    day_of_week: int
    month: int
    is_festival: int
    is_sunday_monday: int
    is_saturday: int
    is_oct_nov: int
    is_somnath_shivratri: int
    is_ambaji_navratri: int
    is_dwarka_janmashtami: int


@app.get("/health")
def health():
    return {"status": "ok", "service": "temple-crowd-ml"}


@app.post("/predict")
def predict(payload: PredictionInput):
    features = [
        [
            payload.temple_code,
            payload.day_of_week,
            payload.month,
            payload.is_festival,
            payload.is_sunday_monday,
            payload.is_saturday,
            payload.is_oct_nov,
            payload.is_somnath_shivratri,
            payload.is_ambaji_navratri,
            payload.is_dwarka_janmashtami,
        ]
    ]
    prediction = float(model.predict(features)[0])
    prediction = max(20, min(100, round(prediction)))
    return {
        "crowd_score": prediction,
        "model_version": "random-forest-v1",
    }

