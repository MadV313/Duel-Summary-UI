// Example data for now; you will replace this with your real duel results
const duelSummary = {
    result: 'Victory', // or 'Defeat'
    winner: 'PlayerOne',
    loser: 'PlayerTwo',
    finalHP: 120,
    cardsStolen: 3,
    trapsTriggered: 2,
    combosTriggered: 1,
    wagered: true,
    wagerWinnerCoins: 500,
    wagerLoserCoins: 500
};

function loadSummary() {
    const resultText = document.getElementById('resultText');
    const winnerName = document.getElementById('winnerName');
    const loserName = document.getElementById('loserName');
    const finalHP = document.getElementById('finalHP');
    const eventList = document.getElementById('eventList');
    const wagerSection = document.getElementById('wagerSection');
    const wagerText = document.getElementById('wagerText');

    resultText.textContent = duelSummary.result.toUpperCase();
    resultText.style.color = (duelSummary.result === 'Victory') ? '#00FF00' : '#FF3333';

    winnerName.textContent = `Winner: ${duelSummary.winner}`;
    loserName.textContent = `Loser: ${duelSummary.loser}`;
    finalHP.textContent = `Final HP: ${duelSummary.finalHP}`;

    if (duelSummary.cardsStolen > 0) {
        const li = document.createElement('li');
        li.textContent = `Cards Stolen: x${duelSummary.cardsStolen}`;
        eventList.appendChild(li);
    }
    if (duelSummary.trapsTriggered > 0) {
        const li = document.createElement('li');
        li.textContent = `Traps Triggered: x${duelSummary.trapsTriggered}`;
        eventList.appendChild(li);
    }
    if (duelSummary.combosTriggered > 0) {
        const li = document.createElement('li');
        li.textContent = `Combos Triggered: x${duelSummary.combosTriggered}`;
        eventList.appendChild(li);
    }

    if (duelSummary.wagered) {
        wagerSection.style.display = 'block';
        wagerText.textContent = `${duelSummary.winner} gained +${duelSummary.wagerWinnerCoins} coins\n${duelSummary.loser} lost -${duelSummary.wagerLoserCoins} coins`;
    }
}

function returnToMenu() {
    window.location.href = "index.html"; // You can adjust this path
}

// Load on page start
window.onload = loadSummary;
