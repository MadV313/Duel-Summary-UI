// summary.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const duelId = urlParams.get('duelId');

    if (!duelId) {
        document.getElementById('resultText').textContent = 'Duel ID not found.';
        return;
    }

    fetch(`https://duel-bot-backend-production.up.railway.app/summary/${duelId}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            displaySummary(data);
        })
        .catch(err => {
            console.error("Failed to load summary:", err);
            document.getElementById('resultText').textContent = 'Summary load failed.';
        });
});

function displaySummary(summary) {
    const { players, winner, events, wager } = summary;

    const winnerName = players[winner]?.discordName || 'Winner';
    const loserKey = winner === 'player1' ? 'player2' : 'player1';
    const loserName = players[loserKey]?.discordName || 'Opponent';

    document.getElementById('resultText').textContent = `${winnerName.toUpperCase()} WINS THE DUEL!`;
    document.getElementById('winnerName').textContent = `Winner: ${winnerName}`;
    document.getElementById('loserName').textContent = `Loser: ${loserName}`;
    document.getElementById('finalHP').textContent = `Final HP: ${players[winner]?.hp || 0}`;

    const eventList = document.getElementById('eventList');
    if (Array.isArray(events)) {
        events.forEach(event => {
            const li = document.createElement('li');
            li.textContent = event;
            eventList.appendChild(li);
        });
    }

    if (wager) {
        document.getElementById('wagerSection').style.display = 'block';
        document.getElementById('wagerText').textContent =
            `${winnerName} gained +${wager.amount} coins.`;
    }
}

function returnToMenu() {
    window.location.href = '/';
}
