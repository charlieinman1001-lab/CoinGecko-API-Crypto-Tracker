async function fetchRequest(url){
    try{
        const response = await fetch(url)

        if(!response.ok){
            const err = new Error(`API error: ${response.status} ${response.statusText}`)
            err.status = response.status
            throw err
        }

        document.getElementById("apiErrorText").innerHTML = ""
        return await response.json()

    }catch(error){
        console.log(`Failed to fetch from ${url}`)

        document.getElementById("apiErrorText").innerHTML = "Couldn't reach the API. This may be a result of too many fetch requests, please wait a minute and try again."

        throw error
    } 
}



let priceChart, currentCoinPrice
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




function stringifyNumber(num){   //nifty little function that makes big numbers nice to read
    const endings = ["k", "M", "B", "T", "Quad", "Quint", "Sept"]

    const numString = num.toString()   //toPrecision doesnt work here, toString() might affect length
    const numOfDigits = numString.length

    if(num < 1000){
        return numString
    }

    const index = parseInt(Math.floor((numOfDigits-1)/3)) 
    return numString/(10**(3*index)) + endings[index-1]

}




const searchInput = document.getElementById('coinSearch')
const resultsList = document.getElementById('coinResults')

function updateDropdownMatches(){
    const query = searchInput.value.trim().toLowerCase()
    resultsList.innerHTML = ''

    let matches
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
            displayCoinAnalytics()
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
    const buttons = document.querySelectorAll(".timePeriodButton")

    if(!clickedBtn.classList.contains("active")){
        timeSeriesLength = days
        displayCoinData()


        buttons.forEach(btn => btn.classList.remove('active'))
        clickedBtn.classList.add('active')    
    }

}


async function displayCoinAnalytics(){
    const coinData = await fetchRequest(`https://api.coingecko.com/api/v3/coins/${currentCoinId}?localization=false&tickers=false&community_data=false&developer_data=false`)


    currentCoinPrice = coinData.market_data.current_price.gbp
    const marketCap = coinData.market_data.market_cap.gbp
    const change24h = coinData.market_data.price_change_percentage_24h
    const coinLogoURL = coinData.image.small
    const marketCapRank = coinData.market_cap_rank


    document.getElementById("coinPrice").innerHTML = `${parseFloat(currentCoinPrice.toPrecision(5))}gbp`
    document.getElementById("marketCapRank").innerHTML = `${marketCapRank}`
    document.getElementById("marketCap").innerHTML = `${stringifyNumber(parseFloat(marketCap.toPrecision(3)))} gbp`

    if(coinLogoURL){document.getElementById("coinLogo").src = coinLogoURL}
    else{
        document.getElementById("coinLogo").src = ""
    }


    const dailyChangeElement = document.getElementById("24hrChange")
    dailyChangeElement.innerHTML = `${parseFloat(change24h.toPrecision(3))}%`

    if(change24h > 0){
        dailyChangeElement.style.color = "green"
        dailyChangeElement.innerHTML = "+" + dailyChangeElement.innerHTML
    }
    else{
        dailyChangeElement.style.color = "red"
    }



}




displayCoinAnalytics()
displayCoinData()






