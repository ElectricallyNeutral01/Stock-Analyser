import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")
CORS(app)

# Get API key from environment with fallback
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

def get_stock_data(symbol):
    """Fetch historical stock data from Alpha Vantage with intraday data."""
    try:
        # Use intraday data (60min intervals) for more granular information
        url = f'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=60min&apikey={API_KEY}&outputsize=compact'
        response = requests.get(url)
        data = response.json()
        
        # Check for error responses
        if 'Error Message' in data:
            logger.error(f"Alpha Vantage API error: {data['Error Message']}")
            return None
        
        time_series_key = 'Time Series (60min)'
        if time_series_key not in data:
            logger.error(f"Unexpected API response: {data}")
            return None
            
        return data[time_series_key]
    except Exception as e:
        logger.error(f"Error fetching stock data: {str(e)}")
        return None

def extract_features(stock_data):
    """Extract features from historical stock data."""
    try:
        # Sort dates in descending order (most recent first)
        dates = sorted(stock_data.keys(), reverse=True)
        
        # Get closing prices for each date
        prices = [float(stock_data[date]['4. close']) for date in dates]
        volumes = [float(stock_data[date]['5. volume']) for date in dates]
        
        # Calculate price changes (day-to-day)
        price_changes = [prices[i] - prices[i+1] for i in range(len(prices)-1)]
        
        # Calculate various metrics
        features = {
            'avg_price': np.mean(prices),
            'volatility': np.std(prices),
            'latest_price': prices[0],
            'price_change': prices[0] - prices[-1] if len(prices) > 1 else 0,
            'price_change_percent': ((prices[0] - prices[-1]) / prices[-1] * 100) if len(prices) > 1 else 0,
            'avg_volume': np.mean(volumes),
            'daily_return': np.mean(price_changes) if price_changes else 0,
            'dates': dates[:30],  # Last 30 days for charts
            'prices': prices[:30],  # Last 30 days for charts
            'volumes': volumes[:30]  # Last 30 days for charts
        }
        return features
    except Exception as e:
        logger.error(f"Error extracting features: {str(e)}")
        return None

def train_ai_model():
    """Train a simple AI model for demonstration purposes."""
    # For a real app, we would train on actual historical data
    # Here we create a simple RandomForest classifier
    
    # Example feature set (price, volatility, volume)
    X = np.array([
        [150, 5, 1000000],  # Good stock example
        [200, 20, 500000],  # Bad stock example
        [120, 10, 750000],  # Average stock
        [180, 7, 900000],   # Good stock example
        [220, 25, 300000],  # Bad stock example
    ])
    
    # Labels: 1 = good investment, 0 = bad investment
    y = np.array([1, 0, 0, 1, 0])
    
    # Train model
    model = RandomForestClassifier(n_estimators=10)
    model.fit(X, y)
    
    return model

def compare_stocks_ai(stock1_features, stock2_features):
    """Compare two stocks and provide analysis."""
    # Scoring factors (higher score is better)
    score1 = 0
    score2 = 0
    
    comparison_results = []
    
    # 1. Volatility (lower is better)
    if stock1_features['volatility'] < stock2_features['volatility']:
        score1 += 1
        comparison_results.append({
            'factor': 'Volatility',
            'winner': 'stock1',
            'description': 'Lower volatility generally indicates less risk'
        })
    else:
        score2 += 1
        comparison_results.append({
            'factor': 'Volatility',
            'winner': 'stock2',
            'description': 'Lower volatility generally indicates less risk'
        })
    
    # 2. Price trend (higher positive change is better)
    if stock1_features['price_change_percent'] > stock2_features['price_change_percent']:
        score1 += 1
        comparison_results.append({
            'factor': 'Price Trend',
            'winner': 'stock1',
            'description': 'Stronger upward price momentum'
        })
    else:
        score2 += 1
        comparison_results.append({
            'factor': 'Price Trend',
            'winner': 'stock2',
            'description': 'Stronger upward price momentum'
        })
    
    # 3. Volume (higher is generally better - indicates liquidity)
    if stock1_features['avg_volume'] > stock2_features['avg_volume']:
        score1 += 1
        comparison_results.append({
            'factor': 'Trading Volume',
            'winner': 'stock1',
            'description': 'Higher volume indicates better liquidity'
        })
    else:
        score2 += 1
        comparison_results.append({
            'factor': 'Trading Volume',
            'winner': 'stock2',
            'description': 'Higher volume indicates better liquidity'
        })
    
    # 4. Daily return (higher is better)
    if stock1_features['daily_return'] > stock2_features['daily_return']:
        score1 += 1
        comparison_results.append({
            'factor': 'Average Daily Return',
            'winner': 'stock1',
            'description': 'Higher average daily price increase'
        })
    else:
        score2 += 1
        comparison_results.append({
            'factor': 'Average Daily Return',
            'winner': 'stock2',
            'description': 'Higher average daily price increase'
        })
    
    # Determine winner
    if score1 > score2:
        result = {
            'winner': 'stock1',
            'score1': score1,
            'score2': score2,
            'conclusion': f"Based on our analysis, the first stock appears to be a better investment option with a score of {score1}/{score1+score2}.",
            'factors': comparison_results
        }
    elif score2 > score1:
        result = {
            'winner': 'stock2',
            'score1': score1,
            'score2': score2,
            'conclusion': f"Based on our analysis, the second stock appears to be a better investment option with a score of {score2}/{score1+score2}.",
            'factors': comparison_results
        }
    else:
        result = {
            'winner': 'tie',
            'score1': score1,
            'score2': score2,
            'conclusion': "Both stocks appear equally matched in our analysis. Consider other factors or your investment goals before making a decision.",
            'factors': comparison_results
        }
    
    return result

def get_popular_stocks():
    """Return a list of popular stock symbols for dropdown menu."""
    return [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "META", "name": "Meta Platforms Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
        {"symbol": "JNJ", "name": "Johnson & Johnson"},
        {"symbol": "V", "name": "Visa Inc."},
        {"symbol": "PG", "name": "Procter & Gamble Co."},
        {"symbol": "UNH", "name": "UnitedHealth Group Inc."},
        {"symbol": "HD", "name": "Home Depot Inc."},
        {"symbol": "BAC", "name": "Bank of America Corp."},
        {"symbol": "MA", "name": "Mastercard Inc."},
        {"symbol": "DIS", "name": "Walt Disney Co."},
        {"symbol": "ADBE", "name": "Adobe Inc."},
        {"symbol": "CRM", "name": "Salesforce Inc."},
        {"symbol": "NFLX", "name": "Netflix Inc."},
        {"symbol": "INTC", "name": "Intel Corporation"}
    ]

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    """Return a list of popular stocks for the dropdown menus."""
    return jsonify({
        'success': True,
        'stocks': get_popular_stocks()
    })

@app.route('/api/compare', methods=['POST'])
def compare_stocks():
    """Compare two stocks using AI."""
    data = request.get_json()
    stock1 = data.get('stock1', '').strip().upper()
    stock2 = data.get('stock2', '').strip().upper()
    
    if not stock1 or not stock2:
        return jsonify({
            'success': False,
            'error': 'Please provide both stock symbols.'
        }), 400
        
    # Fetch data for both stocks
    stock1_data = get_stock_data(stock1)
    stock2_data = get_stock_data(stock2)
    
    # Check if data fetching was successful
    if not stock1_data:
        return jsonify({
            'success': False,
            'error': f'Could not fetch data for {stock1}. Please check the symbol and try again.'
        }), 400
        
    if not stock2_data:
        return jsonify({
            'success': False,
            'error': f'Could not fetch data for {stock2}. Please check the symbol and try again.'
        }), 400
    
    # Extract features
    stock1_features = extract_features(stock1_data)
    stock2_features = extract_features(stock2_data)
    
    if not stock1_features or not stock2_features:
        return jsonify({
            'success': False,
            'error': 'Error processing stock data. Please try again.'
        }), 500
    
    # Compare using AI
    result = compare_stocks_ai(stock1_features, stock2_features)
    
    # Format the response
    response = {
        'success': True,
        'stock1': {
            'symbol': stock1,
            'features': stock1_features
        },
        'stock2': {
            'symbol': stock2,
            'features': stock2_features
        },
        'comparison': result
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
