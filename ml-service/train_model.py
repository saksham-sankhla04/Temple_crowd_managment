from pathlib import Path
import random
import joblib
from sklearn.ensemble import RandomForestRegressor


ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "crowd_model.joblib"


def score_rule(
    is_festival: int,
    is_sunday_monday: int,
    is_saturday: int,
    is_oct_nov: int,
    is_somnath_shivratri: int,
    is_ambaji_navratri: int,
    is_dwarka_janmashtami: int,
) -> int:
    score = 40
    if is_festival:
        score += 30
    if is_sunday_monday:
        score += 15
    if is_saturday:
        score += 10
    if is_oct_nov:
        score += 10
    if is_somnath_shivratri:
        score += 20
    if is_ambaji_navratri:
        score += 20
    if is_dwarka_janmashtami:
        score += 20
    return max(20, min(100, score))


def generate_dataset(n: int = 6000):
    rows = []
    targets = []

    for _ in range(n):
        temple_code = random.randint(0, 3)
        day_of_week = random.randint(0, 6)
        month = random.randint(1, 12)

        is_festival = 1 if random.random() < 0.14 else 0
        is_sunday_monday = 1 if day_of_week in (0, 1) else 0
        is_saturday = 1 if day_of_week == 6 else 0
        is_oct_nov = 1 if month in (10, 11) else 0

        # Temple/festival interaction features.
        is_somnath_shivratri = 1 if (temple_code == 0 and random.random() < 0.08 and is_festival) else 0
        is_ambaji_navratri = 1 if (temple_code == 2 and random.random() < 0.10 and is_festival) else 0
        is_dwarka_janmashtami = 1 if (temple_code == 1 and random.random() < 0.08 and is_festival) else 0

        rule_score = score_rule(
            is_festival,
            is_sunday_monday,
            is_saturday,
            is_oct_nov,
            is_somnath_shivratri,
            is_ambaji_navratri,
            is_dwarka_janmashtami,
        )

        # Synthetic historical noise to mimic real fluctuations.
        noisy_target = max(20, min(100, rule_score + random.randint(-6, 6)))

        rows.append(
            [
                temple_code,
                day_of_week,
                month,
                is_festival,
                is_sunday_monday,
                is_saturday,
                is_oct_nov,
                is_somnath_shivratri,
                is_ambaji_navratri,
                is_dwarka_janmashtami,
            ]
        )
        targets.append(noisy_target)

    return rows, targets


def train_and_save():
    X, y = generate_dataset()
    model = RandomForestRegressor(
        n_estimators=260,
        random_state=42,
        max_depth=12,
        min_samples_leaf=2,
    )
    model.fit(X, y)

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save()

