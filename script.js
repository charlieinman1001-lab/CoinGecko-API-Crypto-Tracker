async function fetchRequest(url){
    try{
        const response = await fetch(url)

        if(!response.ok){
            throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        document.getElementById("apiErrorText").innerHTML = ""

        const data = await response.json()
        return data

    }catch(error){
        console.log(`Failed to fetch from ${url}`)

        document.getElementById("apiErrorText").innerHTML = "Too many API requests, please wait a moment and try again"                 

        throw error
    } 
}




let priceChart
let currentCoinId = "bitcoin"
let timeSeriesLength = 1
let currentCoinName = "Bitcoin"
let allCoins = []

const defaultDropdownMatches = [    
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP' },
    { id: 'solana', symbol: 'sol', name: 'Solana' }
]


async function loadCoinList() {
    const cached = localStorage.getItem('coinList')
    const cachedTime = localStorage.getItem('coinListTime')
    const oneDay = 24 * 60 * 60 * 1000

    if (cached && cachedTime && (Date.now() - cachedTime < oneDay)) {
        allCoins = JSON.parse(cached)
        return
    }

    const data = await fetchRequest('https://api.coingecko.com/api/v3/coins/list')
    if (data) {
        allCoins = data;
        localStorage.setItem('coinList', JSON.stringify(data))
        localStorage.setItem('coinListTime', Date.now())
    }
}
loadCoinList()





const searchInput = document.getElementById('coinSearch')
const resultsList = document.getElementById('coinResults')

function updateDropdownMatches(){
    const query = searchInput.value.trim().toLowerCase()
    resultsList.innerHTML = ''

    let matches
    console.log(query)
    if (query.length === 0){
        matches = defaultDropdownMatches
    }
    else{
        matches = allCoins
            .filter(coin =>
                coin.name.toLowerCase().includes(query) ||
                coin.symbol.toLowerCase().includes(query)
            )
            .slice(0, 100)        //to prevent dropdown options from blowing up 
    }

    matches.forEach(coin => {
        const li = document.createElement('li')
        li.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`
        li.addEventListener('click', () => {
            currentCoinName = `${coin.name}`
            li.textContent = currentCoinName
            searchInput.value = coin.name
            resultsList.innerHTML = ''
            currentCoinId = coin.id
            displayCoinData()
        });
        resultsList.appendChild(li)
    });
}




searchInput.addEventListener('input', updateDropdownMatches)

searchInput.addEventListener('click', () => {  //reset dropdown to default choices when input box is clicked on 
    searchInput.value = ''
    updateDropdownMatches()

})

document.addEventListener('click', (event) => {
    const searchWrapper = document.getElementById('coinSearchContainer')
    if(!searchWrapper.contains(event.target)){
        resultsList.innerHTML = ''
    }
})


















async function displayCoinData(){
    let history = await fetchRequest(`https://api.coingecko.com/api/v3/coins/${currentCoinId}/market_chart?vs_currency=gbp&days=${timeSeriesLength}`)



    let dates = history.prices.map(point => {
        const date = new Date(point[0])
        return date.toLocaleDateString()
    })
    let prices = history.prices.map(point => point[1])

    if(priceChart){ priceChart.destroy() }



    priceChart = new Chart(document.getElementById('priceChart'), {
    type: 'line',
    data: {
        labels: dates,
        datasets: [{
        label: `${currentCoinName} Price`,
        data: prices,
        borderColor: 'green',
        fill: false,
        pointRadius:0,
        pointHoverRadius: 10,
        pointHitRadius: 10
        }]
    },
    options: {
        responsive:true,
        scales: {
            y: {
                ticks: {
                    callback: function(value){
                        return '£' + parseFloat(value.toPrecision(3))
                    }
                }
            }
        }
    }
    })
}


function changeTimeSeriesLength(days, clickedBtn){
    timeSeriesLength = days
    displayCoinData()

    const buttons = document.querySelectorAll(".timePeriodButton")

    buttons.forEach(btn => btn.classList.remove('active'))
    clickedBtn.classList.add('active')
}


displayCoinData();






