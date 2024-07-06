// Constantes
const TEMPO_PADRAO = 10;
const PREFIXO_ID = document.body.getAttribute('data-prefixo');
const NUM_CRONOMETROS = 45;

class Cronometro {
    static alarmeSoando = false;
    static audioContextInitialized = false;
    static cronometrosEmOvertime = [];

    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.tempoInicial = parseInt(localStorage.getItem(`${elementId}-tempoInicial`)) || TEMPO_PADRAO;
        this.timestamp = parseInt(localStorage.getItem(`${elementId}-timestamp`)) || null;
        this.emExecucao = false;
        this.corPadrao = "#f4f4f4";
        this.alarmTriggered = false;

        this.setupElement();
        this.setupAudio();
        this.atualizarTempoDecorrido();
        this.atualizarInterface();

        if (this.timestamp) {
            this.iniciar();
        }

        if (this.overtime > 0) {
            Cronometro.cronometrosEmOvertime.push(this);
        }
    }

    setupElement() {
        this.element.style.transition = 'background-color 0.5s ease';
        this.tempoElement = this.element.querySelector('.tempo');
    }

    setupAudio() {
        this.audio = new Audio('audio/alarm.mp3');
        this.audio.loop = true;
    }

    atualizarTempoDecorrido() {
        if (this.timestamp) {
            const tempoDecorrido = (Date.now() / 1000) - this.timestamp;
            this.tempo = Math.max(this.tempoInicial - tempoDecorrido, 0);
            this.overtime = Math.max(tempoDecorrido - this.tempoInicial, 0);

            if (this.tempo <= 0 && !this.alarmTriggered) {
                this.playAlarmSound();
                this.alarmTriggered = true;
            }
        } else {
            this.tempo = this.tempoInicial;
            this.overtime = 0;
        }
    }

    iniciar() {
        if (!this.emExecucao) {
            this.emExecucao = true;
            if (!this.timestamp) {
                this.timestamp = Date.now() / 1000;
                localStorage.setItem(`${this.element.id}-timestamp`, this.timestamp);
            }
            this.atualizarLoop();
        }
    }

    atualizarLoop() {
        if (this.emExecucao) {
            this.atualizarTempoDecorrido();
            this.atualizarInterface();
            requestAnimationFrame(() => this.atualizarLoop());
        }
    }

    parar() {
        this.emExecucao = false;
    }

    reiniciar() {
        showModal("Deseja realmente reiniciar o cronômetro?", () => this.resetar());
    }

    resetar() {
        this.parar();
        this.tempoInicial = TEMPO_PADRAO;
        this.tempo = TEMPO_PADRAO;
        this.overtime = 0;
        this.timestamp = null;
        this.alarmTriggered = false;
        this.atualizarInterface();
        localStorage.removeItem(`${this.element.id}-tempoInicial`);
        localStorage.removeItem(`${this.element.id}-timestamp`);
        this.stopAlarmSound();
    }

    atualizarInterface() {
        this.atualizarTempo();
        this.atualizarCor();
    }

    atualizarTempo() {
        const tempo = this.tempo > 0 ? this.tempo : this.overtime;
        const { horas, minutos, segundos } = this.calcularTempo(tempo);
        const sinal = this.tempo > 0 ? '' : '+';
        this.tempoElement.textContent = `${sinal}${horas}:${minutos}:${segundos}`;
    }

    calcularTempo(tempo) {
        const horas = Math.floor(tempo / 3600).toString().padStart(2, '0');
        const minutos = Math.floor((tempo % 3600) / 60).toString().padStart(2, '0');
        const segundos = Math.floor(tempo % 60).toString().padStart(2, '0');
        return { horas, minutos, segundos };
    }

    atualizarCor() {
        let novaCor;

        if (!this.emExecucao) {
            novaCor = this.corPadrao;
            this.element.style.color = 'black';
        } else if (this.tempo > 0) {
            const progress = 1 - (this.tempo / this.tempoInicial);
            novaCor = this.calcularCorGradiente(progress);
            this.element.style.color = 'black';
        } else {
            novaCor = 'black';
            this.element.style.color = 'white';
        }

        this.element.style.backgroundColor = novaCor;
    }

    calcularCorGradiente(progress) {
        const r = Math.round(255 * Math.min(2 * progress, 1));
        const g = Math.round(255 * Math.min(2 - 2 * progress, 1));
        return `rgb(${r}, ${g}, 0)`;
    }

    playAlarmSound() {
        if (Cronometro.audioContextInitialized && !Cronometro.alarmeSoando) {
            Cronometro.alarmeSoando = true;
            this.audio.play().catch(error => console.error('Erro ao tocar o áudio:', error));
        } else {
            console.log('Áudio não inicializado ou alarme já tocando.');
            if (!Cronometro.cronometrosEmOvertime.includes(this)) {
                Cronometro.cronometrosEmOvertime.push(this);
            }
        }
    }

    stopAlarmSound() {
        this.audio.pause();
        this.audio.currentTime = 0;
        Cronometro.alarmeSoando = false;
    }

    static ordenarCronometros(cronometros) {
        return cronometros.sort((a, b) => {
            if (a.tempo === 0 && b.tempo === 0) return b.overtime - a.overtime;
            if (a.tempo === 0) return -1;
            if (b.tempo === 0) return 1;
            return a.tempo - b.tempo;
        });
    }

    static initAudioContext() {
        if (!Cronometro.audioContextInitialized) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            Cronometro.audioContextInitialized = true;
            
            Cronometro.verificarETocarAlarme();
        }
    }

    static verificarETocarAlarme() {
        if (Cronometro.cronometrosEmOvertime.length > 0 && !Cronometro.alarmeSoando) {
            Cronometro.cronometrosEmOvertime[0].playAlarmSound();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const cronometros = [];
    const container = document.querySelector('.container');

    for (let i = 1; i <= NUM_CRONOMETROS; i++) {
        const cronometroId = `${PREFIXO_ID}-${i.toString().padStart(2, '0')}`;
        const cronometro = new Cronometro(cronometroId);
        cronometros.push(cronometro);

        document.getElementById(`btnIniciar${i}`).addEventListener('click', () => {
            Cronometro.initAudioContext();
            cronometro.iniciar();
            verificarCronometrosOvertime();
        });

        document.getElementById(`btnReiniciar${i}`).addEventListener('click', () => {
            Cronometro.initAudioContext();
            cronometro.reiniciar();
            verificarCronometrosOvertime();
        });
    }

    document.getElementById('btnResetarTodos').addEventListener('click', () => {
        showModal("Deseja realmente reiniciar todos os cronômetros?", () => {
            cronometros.forEach(cronometro => cronometro.resetar());
            verificarCronometrosOvertime();
        });
    });

    function ordenarEAtualizarCronometros() {
        Cronometro.ordenarCronometros(cronometros);
        container.innerHTML = '';
        cronometros.forEach(cronometro => container.appendChild(cronometro.element));
    }

    function verificarCronometrosOvertime() {
        Cronometro.cronometrosEmOvertime = cronometros.filter(c => c.overtime > 0);
        Cronometro.verificarETocarAlarme();
    }

    setInterval(ordenarEAtualizarCronometros, 1000);
    setInterval(verificarCronometrosOvertime, 1000);

    ['mostrarPrimeiras21', 'mostrarRestantes', 'mostrarTodos'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => atualizarVisibilidade(id));
    });

    function atualizarVisibilidade(modo) {
        cronometros.forEach((cronometro, index) => {
            const visivel = (modo === 'mostrarTodos') ||
                            (modo === 'mostrarPrimeiras21' && index < 21) ||
                            (modo === 'mostrarRestantes' && index >= 21);
            cronometro.element.style.display = visivel ? 'inline-block' : 'none';
        });
    }

    // Adiciona um event listener para qualquer clique na página
    document.addEventListener('click', () => {
        Cronometro.initAudioContext();
        verificarCronometrosOvertime();
    }, { once: true });  // O evento será disparado apenas uma vez
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        document.querySelectorAll(`[id^="${PREFIXO_ID}-"]`).forEach(elem => {
            const cronometro = elem.__cronometro;
            if (cronometro?.emExecucao) {
                cronometro.atualizarTempoDecorrido();
                cronometro.atualizarInterface();
            }
        });
        Cronometro.verificarETocarAlarme();
    }
});

function showModal(message, onConfirm, onCancel) {
    const modal = document.getElementById('customModal');
    document.getElementById('modalMessage').textContent = message;
    modal.style.display = 'block';

    document.getElementById('modalConfirm').onclick = () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    };

    document.getElementById('modalCancel').onclick = () => {
        modal.style.display = 'none';
        if (onCancel) onCancel();
    };
}

window.onclick = (event) => {
    if (event.target === document.getElementById('customModal')) {
        document.getElementById('customModal').style.display = 'none';
    }
};
