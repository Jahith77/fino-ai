from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression


app = FastAPI(title="FINO AI - ML Service")


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def health_check():

    return {
        "status": "ok",
        "service": "FINO AI ML Service"
    }


# =========================================================
# COMMON DATA NORMALIZATION
# =========================================================

def normalize_expenses(expenses: List[Dict[str, Any]]):

    normalized = []

    for index, expense in enumerate(expenses):

        # -------------------------
        # ID
        # -------------------------

        expense_id = (
            expense.get("id")
            or expense.get("_id")
            or expense.get("expenseId")
            or str(index)
        )

        # -------------------------
        # DATE
        # -------------------------

        date = (
            expense.get("date")
            or expense.get("createdAt")
            or expense.get("created_at")
        )

        # -------------------------
        # AMOUNT
        # -------------------------

        amount = (
            expense.get("amount")
            or expense.get("price")
            or expense.get("value")
        )

        # -------------------------
        # CATEGORY
        # -------------------------

        category = (
            expense.get("category")
            or expense.get("type")
            or "Other"
        )

        if date is None:
            continue

        if amount is None:
            continue

        try:
            amount = float(amount)
        except:
            continue

        normalized.append({
            "id": str(expense_id),
            "date": str(date),
            "amount": amount,
            "category": str(category)
        })

    return normalized


# =========================================================
# PREDICT
# =========================================================

class PredictRequest(BaseModel):

    expenses: List[Dict[str, Any]]
    forecast_days: int = 30


@app.post("/predict")
def predict_spending(request: PredictRequest):

    expenses = normalize_expenses(
        request.expenses
    )

    # -----------------------------------------------------
    # Minimum data validation
    # -----------------------------------------------------

    if len(expenses) < 5:

        raise HTTPException(
            status_code=400,
            detail="Need at least 5 valid expense records to generate a forecast"
        )

    df = pd.DataFrame(expenses)

    # -----------------------------------------------------
    # Convert date
    # -----------------------------------------------------

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["date"]
    )

    if len(df) < 5:

        raise HTTPException(
            status_code=400,
            detail="Not enough valid dates in expense records"
        )

    # -----------------------------------------------------
    # Sort by date
    # -----------------------------------------------------

    df = df.sort_values("date")

    # -----------------------------------------------------
    # Group expenses by day
    # -----------------------------------------------------

    daily = (
        df.groupby(
            df["date"].dt.date
        )["amount"]
        .sum()
    )

    # -----------------------------------------------------
    # Create continuous date range
    # -----------------------------------------------------

    first_date = pd.to_datetime(
        daily.index.min()
    )

    last_date = pd.to_datetime(
        daily.index.max()
    )

    date_range = pd.date_range(
        first_date,
        last_date
    )

    daily = daily.reindex(
        date_range.date,
        fill_value=0
    )

    daily = daily.astype(float)

    # -----------------------------------------------------
    # Recent spending analysis
    #
    # We use the most recent 30 days because recent
    # spending is more useful for personal finance
    # forecasting than very old spending.
    # -----------------------------------------------------

    recent_days = min(
        30,
        len(daily)
    )

    recent = daily.tail(
        recent_days
    )

    recent_average = float(
        recent.mean()
    )

    # -----------------------------------------------------
    # If recent average is zero, return zero forecast
    # -----------------------------------------------------

    if recent_average <= 0:

        forecast = []

        for i in range(
            request.forecast_days
        ):

            forecast.append({
                "date": str(
                    (
                        last_date +
                        pd.Timedelta(days=i + 1)
                    ).date()
                ),
                "amount": 0
            })

        return {
            "predictions": forecast,
            "forecast": forecast,
            "trend": "stable",
            "confidence": 0,
            "total_predicted": 0
        }

    # -----------------------------------------------------
    # Linear Regression
    #
    # Use recent history instead of the entire history.
    # -----------------------------------------------------

    X = np.arange(
        len(recent)
    ).reshape(-1, 1)

    y = recent.values.astype(float)

    model = LinearRegression()

    model.fit(
        X,
        y
    )

    # -----------------------------------------------------
    # Future prediction
    # -----------------------------------------------------

    future_X = np.arange(
        len(recent),
        len(recent) + request.forecast_days
    ).reshape(-1, 1)

    predictions = model.predict(
        future_X
    )

    predictions = np.array(
        predictions,
        dtype=float
    )

    # -----------------------------------------------------
    # Protect against unrealistic predictions
    #
    # If regression predicts values far below the recent
    # spending level, use the recent average as a safer
    # baseline.
    # -----------------------------------------------------

    minimum_reasonable = (
        recent_average * 0.30
    )

    predictions = np.where(
        predictions < minimum_reasonable,
        recent_average,
        predictions
    )

    # Never allow negative spending

    predictions = np.maximum(
        predictions,
        0
    )

    # -----------------------------------------------------
    # Forecast dates
    # -----------------------------------------------------

    forecast = []

    for i, value in enumerate(
        predictions
    ):

        forecast.append({
            "date": str(
                (
                    last_date +
                    pd.Timedelta(days=i + 1)
                ).date()
            ),
            "amount": round(
                float(value),
                2
            )
        })

    # -----------------------------------------------------
    # Trend
    # -----------------------------------------------------

    slope = float(
        model.coef_[0]
    )

    # Compare slope with average spending so that
    # tiny numerical changes don't create a strong trend.

    trend_threshold = max(
        recent_average * 0.05,
        0.5
    )

    if slope > trend_threshold:

        trend = "increasing"

    elif slope < -trend_threshold:

        trend = "decreasing"

    else:

        trend = "stable"

    # -----------------------------------------------------
    # Confidence
    # -----------------------------------------------------

    if len(y) > 1:

        score = model.score(
            X,
            y
        )

        confidence = round(
            max(
                float(score),
                0
            ),
            2
        )

    else:

        confidence = 0

    # -----------------------------------------------------
    # Total predicted spending
    # -----------------------------------------------------

    total_predicted = round(
        float(
            np.sum(predictions)
        ),
        2
    )

    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    return {

        "predictions": forecast,

        "forecast": forecast,

        "trend": trend,

        "confidence": confidence,

        "total_predicted": total_predicted
    }


# =========================================================
# ANOMALIES
# =========================================================

class AnomalyRequest(BaseModel):

    expenses: List[Dict[str, Any]]

    sensitivity: float = 2.0


@app.post("/anomalies")
def detect_anomalies(
    request: AnomalyRequest
):

    expenses = normalize_expenses(
        request.expenses
    )

    if len(expenses) < 5:

        raise HTTPException(
            status_code=400,
            detail="Need at least 5 valid expense records"
        )

    df = pd.DataFrame(
        expenses
    )

    anomalies = []

    # -----------------------------------------------------
    # Analyze each category separately
    # -----------------------------------------------------

    for category in df[
        "category"
    ].unique():

        cat_df = df[
            df["category"] == category
        ]

        if len(cat_df) < 3:

            continue

        median = cat_df[
            "amount"
        ].median()

        mad = (
            cat_df["amount"] -
            median
        ).abs().median()

        # Avoid division by zero

        if mad == 0:

            continue

        for _, row in cat_df.iterrows():

            modified_z = (
                0.6745 *
                (
                    row["amount"] -
                    median
                ) /
                mad
            )

            if abs(
                modified_z
            ) >= request.sensitivity:

                multiple = (

                    round(
                        row["amount"] /
                        median,
                        1
                    )

                    if median > 0
                    else 0
                )

                # Severity

                if (
                    abs(modified_z)
                    >= request.sensitivity * 1.5
                ):

                    severity = "high"

                else:

                    severity = "medium"

                # Reason

                if modified_z > 0:

                    reason = (
                        f"{multiple}x higher than typical "
                        f"{category} spend "
                        f"(median: ₹{round(median, 2)})"
                    )

                else:

                    reason = (
                        f"Unusually low {category} "
                        f"spend compared to typical "
                        f"(median: ₹{round(median, 2)})"
                    )

                anomalies.append({

                    "id": str(
                        row["id"]
                    ),

                    "date": str(
                        row["date"]
                    ),

                    "amount": round(
                        float(
                            row["amount"]
                        ),
                        2
                    ),

                    "category": category,

                    "reason": reason,

                    "severity": severity
                })

    return {

        "anomalies": anomalies,

        "total_flagged": len(
            anomalies
        )
    }


# =========================================================
# SUGGESTIONS
# =========================================================

class SuggestionRequest(BaseModel):

    expenses: List[Dict[str, Any]]


@app.post("/suggestions")
def get_suggestions(
    request: SuggestionRequest
):

    expenses = normalize_expenses(
        request.expenses
    )

    if len(expenses) < 5:

        raise HTTPException(
            status_code=400,
            detail="Need at least 5 valid expense records"
        )

    df = pd.DataFrame(
        expenses
    )

    # -----------------------------------------------------
    # Convert date
    # -----------------------------------------------------

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["date"]
    )

    df["month"] = df[
        "date"
    ].dt.to_period("M")

    suggestions = []

    # =====================================================
    # MONTH-OVER-MONTH TREND
    # =====================================================

    monthly = (
        df.groupby(
            ["category", "month"]
        )["amount"]
        .sum()
        .reset_index()
    )

    for category in monthly[
        "category"
    ].unique():

        cat_monthly = monthly[
            monthly["category"] ==
            category
        ].sort_values(
            "month"
        )

        if len(cat_monthly) < 2:

            continue

        last_two = cat_monthly.tail(
            2
        )

        previous = float(
            last_two.iloc[0]["amount"]
        )

        current = float(
            last_two.iloc[1]["amount"]
        )

        if previous == 0:

            continue

        percentage = (
            (
                current -
                previous
            ) /
            previous
        ) * 100

        # -------------------------------------------------
        # Spending increased
        # -------------------------------------------------

        if percentage >= 20:

            suggestions.append({

                "type": "trend",

                "category": category,

                "message": (
                    f"Your {category} spending rose "
                    f"{round(percentage, 1)}% compared "
                    f"to last month "
                    f"(₹{round(previous, 2)} → "
                    f"₹{round(current, 2)}). "
                    f"Consider reviewing recent purchases."
                ),

                "severity": "warning"
            })

        # -------------------------------------------------
        # Spending decreased
        # -------------------------------------------------

        elif percentage <= -20:

            suggestions.append({

                "type": "trend",

                "category": category,

                "message": (
                    f"Nice work — your {category} "
                    f"spending dropped "
                    f"{abs(round(percentage, 1))}% "
                    f"compared to last month."
                ),

                "severity": "positive"
            })

    # =====================================================
    # BUDGET RECOMMENDATIONS
    # =====================================================

    category_avg = (
        df.groupby(
            "category"
        )["amount"]
        .mean()
        .reset_index()
    )

    for _, row in category_avg.iterrows():

        category = row[
            "category"
        ]

        avg_spend = float(
            row["amount"]
        )

        recommended_budget = round(
            avg_spend * 0.9,
            2
        )

        suggestions.append({

            "type": "budget",

            "category": category,

            "message": (
                f"Based on your history, a monthly "
                f"budget of ₹{recommended_budget} "
                f"for {category} could help you "
                f"save about 10% without major "
                f"lifestyle changes."
            ),

            "severity": "info"
        })

    return {

        "suggestions": suggestions,

        "total_suggestions": len(
            suggestions
        )
    }