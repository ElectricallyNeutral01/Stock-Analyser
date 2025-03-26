document.addEventListener('DOMContentLoaded', function() {
    // Get the form element
    const compareForm = document.getElementById('compareForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const resultsSection = document.getElementById('resultsSection');
    
    // Get the stock select elements
    const stock1Select = document.getElementById('stock1');
    const stock2Select = document.getElementById('stock2');
    
    // Charts references
    let priceChart = null;
    let volumeChart = null;
    
    // Fetch the list of stocks for dropdowns when page loads
    fetchStockList();
    
    // Function to fetch stock list from API
    function fetchStockList() {
        fetch('/api/stocks')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    populateStockDropdowns(data.stocks);
                } else {
                    showError('Failed to load stock list. Please refresh the page.');
                }
            })
            .catch(error => {
                console.error('Error fetching stock list:', error);
                showError('Failed to load stock list. Please refresh the page.');
            });
    }
    
    // Function to populate stock dropdowns
    function populateStockDropdowns(stocks) {
        // Clear existing options (except the first placeholder)
        while (stock1Select.options.length > 1) {
            stock1Select.remove(1);
        }
        
        while (stock2Select.options.length > 1) {
            stock2Select.remove(1);
        }
        
        // Add stock options to both dropdowns
        stocks.forEach(stock => {
            const option1 = new Option(`${stock.symbol} - ${stock.name}`, stock.symbol);
            const option2 = new Option(`${stock.symbol} - ${stock.name}`, stock.symbol);
            
            stock1Select.add(option1);
            stock2Select.add(option2);
        });
        
        // Set default selections (first two different stocks)
        if (stocks.length >= 2) {
            stock1Select.value = stocks[0].symbol;
            stock2Select.value = stocks[1].symbol;
        }
    }
    
    // Form submission handler
    compareForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const stock1Symbol = stock1Select.value;
        const stock2Symbol = stock2Select.value;
        
        // Validate inputs
        if (!stock1Symbol || !stock2Symbol) {
            showError('Please select both stocks');
            return;
        }
        
        // Show loading indicator
        showLoading();
        
        // Clear previous results and errors
        hideError();
        hideResults();
        
        // Call API to compare stocks
        compareStocks(stock1Symbol, stock2Symbol);
    });
    
    // Function to call the API
    function compareStocks(stock1, stock2) {
        fetch('/api/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stock1: stock1,
                stock2: stock2
            })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (!data.success) {
                showError(data.error || 'An unexpected error occurred');
                return;
            }
            
            // Display the results
            displayResults(data);
        })
        .catch(error => {
            hideLoading();
            showError('Failed to connect to the server. Please try again.');
            console.error('Error:', error);
        });
    }
    
    // Function to display results
    function displayResults(data) {
        // Update stock names in all sections
        document.getElementById('comparisonTitle').textContent = 
            `${data.stock1.symbol} vs ${data.stock2.symbol}`;
        
        document.getElementById('stock1Name').textContent = data.stock1.symbol;
        document.getElementById('stock2Name').textContent = data.stock2.symbol;
        
        document.getElementById('metricsStock1Name').textContent = data.stock1.symbol;
        document.getElementById('metricsStock2Name').textContent = data.stock2.symbol;
        
        document.getElementById('stock1NameIntra').textContent = data.stock1.symbol;
        document.getElementById('stock2NameIntra').textContent = data.stock2.symbol;
        
        // Update scores
        document.getElementById('stock1Score').textContent = data.comparison.score1;
        document.getElementById('stock2Score').textContent = data.comparison.score2;
        
        // Update comparison result
        document.getElementById('comparisonResult').textContent = data.comparison.conclusion;
        
        // Style the result box based on the winner
        const resultBox = document.getElementById('comparisonResult');
        if (data.comparison.winner === 'stock1') {
            resultBox.className = 'alert alert-success py-1 mb-2 text-center small';
        } else if (data.comparison.winner === 'stock2') {
            resultBox.className = 'alert alert-success py-1 mb-2 text-center small';
        } else {
            resultBox.className = 'alert alert-info py-1 mb-2 text-center small';
        }
        
        // Update factors table
        const factorsTable = document.getElementById('factorsTable');
        factorsTable.innerHTML = '';
        
        data.comparison.factors.forEach(factor => {
            const row = document.createElement('tr');
            
            const factorCell = document.createElement('td');
            factorCell.textContent = factor.factor;
            
            const winnerCell = document.createElement('td');
            winnerCell.innerHTML = factor.winner === 'stock1' 
                ? `<span class="text-success">${data.stock1.symbol}</span>` 
                : `<span class="text-success">${data.stock2.symbol}</span>`;
            
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = factor.description;
            
            row.appendChild(factorCell);
            row.appendChild(winnerCell);
            row.appendChild(descriptionCell);
            
            factorsTable.appendChild(row);
        });
        
        // Update intraday performance data
        updateIntradayData(data);
        
        // Update metrics table
        updateMetricsTable(data);
        
        // Create charts
        createPriceChart(data);
        createVolumeChart(data);
        
        // Show results section
        showResults();
    }
    
    // Function to update intraday performance data
    function updateIntradayData(data) {
        const stock1 = data.stock1;
        const stock2 = data.stock2;
        
        // Latest price badges
        document.getElementById('stock1Latest').textContent = `$${stock1.features.latest_price.toFixed(2)}`;
        document.getElementById('stock2Latest').textContent = `$${stock2.features.latest_price.toFixed(2)}`;
        
        // Price change badges with color coding
        const stock1Change = document.getElementById('stock1Change');
        const stock1ChangePercent = stock1.features.price_change_percent;
        stock1Change.textContent = `${stock1ChangePercent > 0 ? '+' : ''}${stock1ChangePercent.toFixed(2)}%`;
        stock1Change.className = stock1ChangePercent >= 0 ? 'badge bg-success' : 'badge bg-danger';
        
        const stock2Change = document.getElementById('stock2Change');
        const stock2ChangePercent = stock2.features.price_change_percent;
        stock2Change.textContent = `${stock2ChangePercent > 0 ? '+' : ''}${stock2ChangePercent.toFixed(2)}%`;
        stock2Change.className = stock2ChangePercent >= 0 ? 'badge bg-success' : 'badge bg-danger';
        
        // Volume badges with formatting
        document.getElementById('stock1Volume').textContent = formatLargeNumber(stock1.features.avg_volume);
        document.getElementById('stock2Volume').textContent = formatLargeNumber(stock2.features.avg_volume);
    }
    
    // Update metrics table
    function updateMetricsTable(data) {
        const stock1 = data.stock1;
        const stock2 = data.stock2;
        const metricsTable = document.getElementById('metricsTable');
        metricsTable.innerHTML = '';
        
        // Helper function to determine better option and create cell
        const determineBetter = (value1, value2, higherIsBetter = true) => {
            let better;
            if (value1 === value2) {
                better = 'Equal';
            } else if ((higherIsBetter && value1 > value2) || (!higherIsBetter && value1 < value2)) {
                better = stock1.symbol;
            } else {
                better = stock2.symbol;
            }
            
            const cell = document.createElement('td');
            if (better === 'Equal') {
                cell.innerHTML = '<span class="text-info">Equal</span>';
            } else if (better === stock1.symbol) {
                cell.innerHTML = `<span class="text-success">${stock1.symbol}</span>`;
            } else {
                cell.innerHTML = `<span class="text-success">${stock2.symbol}</span>`;
            }
            return cell;
        };
        
        // Create row function
        const createRow = (metric, value1, value2, format, higherIsBetter = true) => {
            const row = document.createElement('tr');
            
            const metricCell = document.createElement('td');
            metricCell.textContent = metric;
            
            const value1Cell = document.createElement('td');
            value1Cell.textContent = format(value1);
            
            const value2Cell = document.createElement('td');
            value2Cell.textContent = format(value2);
            
            row.appendChild(metricCell);
            row.appendChild(value1Cell);
            row.appendChild(value2Cell);
            row.appendChild(determineBetter(value1, value2, higherIsBetter));
            
            return row;
        };
        
        // Latest Price
        metricsTable.appendChild(createRow(
            'Latest Price',
            stock1.features.latest_price,
            stock2.features.latest_price,
            value => `$${value.toFixed(2)}`
        ));
        
        // Average Price
        metricsTable.appendChild(createRow(
            'Average Price (30 days)',
            stock1.features.avg_price,
            stock2.features.avg_price,
            value => `$${value.toFixed(2)}`
        ));
        
        // Price Change
        metricsTable.appendChild(createRow(
            'Price Change',
            stock1.features.price_change,
            stock2.features.price_change,
            value => `$${value.toFixed(2)}`
        ));
        
        // Price Change Percent
        metricsTable.appendChild(createRow(
            'Price Change %',
            stock1.features.price_change_percent,
            stock2.features.price_change_percent,
            value => `${value.toFixed(2)}%`
        ));
        
        // Volatility
        metricsTable.appendChild(createRow(
            'Volatility',
            stock1.features.volatility,
            stock2.features.volatility,
            value => value.toFixed(2),
            false  // Lower is better for volatility
        ));
        
        // Average Volume
        metricsTable.appendChild(createRow(
            'Average Volume',
            stock1.features.avg_volume,
            stock2.features.avg_volume,
            value => value.toLocaleString()
        ));
        
        // Daily Return
        metricsTable.appendChild(createRow(
            'Avg. Daily Return',
            stock1.features.daily_return,
            stock2.features.daily_return,
            value => `$${value.toFixed(3)}`
        ));
    }
    
    // Create price chart
    function createPriceChart(data) {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (priceChart) {
            priceChart.destroy();
        }
        
        // Get both stocks' data
        const stock1 = data.stock1;
        const stock2 = data.stock2;
        
        // Format dates for both stocks
        const dates1 = stock1.features.dates.slice(0, 30).reverse();
        const dates2 = stock2.features.dates.slice(0, 30).reverse();
        
        // Price data
        const prices1 = stock1.features.prices.slice(0, 30).reverse();
        const prices2 = stock2.features.prices.slice(0, 30).reverse();
        
        // Create chart with optimized display for VR
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates1,
                datasets: [
                    {
                        label: stock1.symbol,
                        data: prices1,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 1.5,  // Smaller points for VR readability
                        pointHoverRadius: 3
                    },
                    {
                        label: stock2.symbol,
                        data: prices2,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 1.5,  // Smaller points for VR readability
                        pointHoverRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Price ($)',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 9
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 8
                            },
                            callback: function(value, index, values) {
                                // Display fewer x-axis labels for better readability
                                return index % 3 === 0 ? value : '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 15,
                            padding: 5,
                            font: {
                                size: 10
                            }
                        }
                    },
                    title: {
                        display: false // Remove title to save space
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        titleFont: {
                            size: 10
                        },
                        bodyFont: {
                            size: 10
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += '$' + context.parsed.y.toFixed(2);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Create volume chart
    function createVolumeChart(data) {
        const ctx = document.getElementById('volumeChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (volumeChart) {
            volumeChart.destroy();
        }
        
        // Get both stocks' data
        const stock1 = data.stock1;
        const stock2 = data.stock2;
        
        // Format dates for both stocks (use just one set since they should align)
        const dates = stock1.features.dates.slice(0, 15).reverse();
        
        // Volume data
        const volumes1 = stock1.features.volumes.slice(0, 15).reverse();
        const volumes2 = stock2.features.volumes.slice(0, 15).reverse();
        
        // Create chart with VR optimizations
        volumeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: stock1.symbol,
                        data: volumes1,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        barPercentage: 0.7,  // Slimmer bars for better visualization
                        categoryPercentage: 0.8
                    },
                    {
                        label: stock2.symbol,
                        data: volumes2,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Volume',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 9
                            },
                            callback: function(value, index, values) {
                                return formatLargeNumber(value);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 8
                            },
                            callback: function(value, index, values) {
                                // Display fewer x-axis labels for better readability
                                return index % 3 === 0 ? value : '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 15,
                            padding: 5,
                            font: {
                                size: 10
                            }
                        }
                    },
                    title: {
                        display: false  // Remove title to save space
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        titleFont: {
                            size: 10
                        },
                        bodyFont: {
                            size: 10
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatLargeNumber(context.parsed.y);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Show/hide utility functions
    function showLoading() {
        loadingIndicator.classList.remove('d-none');
    }
    
    function hideLoading() {
        loadingIndicator.classList.add('d-none');
    }
    
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('d-none');
    }
    
    function hideError() {
        errorMessage.classList.add('d-none');
    }
    
    function showResults() {
        resultsSection.classList.remove('d-none');
    }
    
    function hideResults() {
        resultsSection.classList.add('d-none');
    }
});
