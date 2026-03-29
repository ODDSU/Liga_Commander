let jugadores = JSON.parse(localStorage.getItem('commander_jugadores')) || [];
let historial = JSON.parse(localStorage.getItem('commander_historial')) || [];
let contadorManual = 0; 
const puntosGlobales = [4, 3, 2, 1, 0]; 

let ventanaTV = null;
let ultimasMesasGeneradas = []; 

let mostrarTodosJugadores = false;
let isModoEdicionExcel = false; 
const jornadasLista = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'Semifinal', 'Final'];
let indiceJornadaActual = 0;

function cambiarJornada(direccion) {
    indiceJornadaActual += direccion;
    if (indiceJornadaActual < 0) indiceJornadaActual = 0;
    if (indiceJornadaActual >= jornadasLista.length) indiceJornadaActual = jornadasLista.length - 1;
    document.getElementById('display-jornada').innerText = jornadasLista[indiceJornadaActual];
    localStorage.setItem('commander_jornada_activa', indiceJornadaActual);
}

function toggleMostrarTodos() {
    mostrarTodosJugadores = !mostrarTodosJugadores;
    renderizarClasificacion();
}

function toggleFullscreen() {
    const card = document.getElementById('tarjeta-clasificacion');
    const btn = document.getElementById('btn-fullscreen');
    card.classList.toggle('fullscreen-card');
    if(card.classList.contains('fullscreen-card')) {
        btn.innerHTML = "↙️ Salir Pantalla Completa";
        mostrarTodosJugadores = true; 
    } else {
        btn.innerHTML = "🔲 Pantalla Completa";
        mostrarTodosJugadores = false;
    }
    renderizarClasificacion();
}

function guardarDatos() {
    localStorage.setItem('commander_jugadores', JSON.stringify(jugadores));
    localStorage.setItem('commander_historial', JSON.stringify(historial));
    actualizarUI();
}

function agregarJugador() {
    const input = document.getElementById('nuevo-jugador');
    const nombre = input.value.trim();
    if (nombre) {
        jugadores.push({ id: Date.now(), nombre: nombre, puntos: 0, partidas: 0 });
        input.value = '';
        guardarDatos();
    }
}

// --- LÓGICA DE EDICIÓN MODO EXCEL ---
function activarEdicionExcel() {
    isModoEdicionExcel = true;
    mostrarTodosJugadores = true; 
    
    document.getElementById('modo-clasificacion').style.display = 'none';
    document.getElementById('excel-controls').style.display = 'flex';
    
    document.getElementById('tarjeta-clasificacion').scrollIntoView({ behavior: 'smooth' });
    renderizarClasificacion();
}

function cancelarEdicionExcel() {
    isModoEdicionExcel = false;
    
    document.getElementById('modo-clasificacion').style.display = 'block';
    document.getElementById('excel-controls').style.display = 'none';
    
    document.getElementById('modo-clasificacion').value = 'general';
    actualizarUI();
}

function actualizarFilaExcel(inputEl) {
    let tr = inputEl.closest('tr');
    let inputs = tr.querySelectorAll('.excel-cell');
    let total = 0;
    inputs.forEach(inp => {
        let val = parseInt(inp.value);
        if (!isNaN(val)) total += val;
    });
    let celdaTotal = tr.querySelector('.excel-total');
    if(celdaTotal) celdaTotal.innerText = total;
}

function guardarEdicionExcel() {
    let inputs = document.querySelectorAll('.excel-cell');
    let cambiosGuardados = false;

    inputs.forEach(inp => {
        let idJugador = parseInt(inp.getAttribute('data-jid'));
        let jornada = inp.getAttribute('data-jor');
        let valorNuevo = parseInt(inp.value) || 0;
        let valorViejo = parseInt(inp.defaultValue) || 0; 

        if (valorNuevo !== valorViejo) {
            let diferencia = valorNuevo - valorViejo;
            let jugador = jugadores.find(j => j.id === idJugador);

            if (jugador) {
                jugador.puntos += diferencia;
                let etiquetaGuardado = jornada === "BASE" ? "Ajuste Manual" : jornada;

                historial.unshift({
                    id: Date.now() + Math.floor(Math.random() * 10000), 
                    fecha: etiquetaGuardado,
                    resultados: [{ idJugador: jugador.id, nombre: jugador.nombre, puntos: diferencia, posicion: "-" }]
                });
                cambiosGuardados = true;
            }
        }
    });

    if (cambiosGuardados) {
        alert("💾 Puntuaciones guardadas con éxito.");
        guardarDatos();
    }
    
    isModoEdicionExcel = false;
    document.getElementById('modo-clasificacion').style.display = 'block';
    document.getElementById('excel-controls').style.display = 'none';
    document.getElementById('modo-clasificacion').value = 'excel';
    actualizarUI();
}

function anadirPuntosJornada(id) {
    let jugador = jugadores.find(j => j.id === id);
    if (!jugador) return;

    let jornadaSugerida = jornadasLista[indiceJornadaActual];

    let nombreJornada = prompt(`Añadir registro a ${jugador.nombre}\n\nIntroduce el identificador de la Jornada\n(Ejemplo: J1, J2, Semifinal...):`, jornadaSugerida);
    if (!nombreJornada || nombreJornada.trim() === "") return;

    let puntosStr = prompt(`¿Cuántos puntos consiguió ${jugador.nombre} en "${nombreJornada}"?`);
    if (puntosStr === null) return;

    let puntos = parseInt(puntosStr);
    if (isNaN(puntos)) {
        alert("❌ Por favor, introduce un número válido.");
        return;
    }

    jugador.puntos += puntos;
    jugador.partidas += 1;

    historial.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000), 
        fecha: nombreJornada.trim(),
        resultados: [{ idJugador: jugador.id, nombre: jugador.nombre, puntos: puntos, posicion: "-" }]
    });

    guardarDatos();
}

function editarJugador(id) {
    let jugador = jugadores.find(j => j.id === id);
    if (!jugador) return;

    let nuevosPuntos = prompt(`Modificar PUNTOS TOTALES de ${jugador.nombre}\n\nPuntos actuales: ${jugador.puntos}\nIntroduce los nuevos puntos:`, jugador.puntos);
    if (nuevosPuntos === null) return; 

    let nuevasPartidas = prompt(`Modificar PARTIDAS JUGADAS de ${jugador.nombre}\n\nPartidas actuales: ${jugador.partidas}\nIntroduce las nuevas partidas:`, jugador.partidas);
    if (nuevasPartidas === null) return; 

    nuevosPuntos = parseInt(nuevosPuntos);
    nuevasPartidas = parseInt(nuevasPartidas);

    if (!isNaN(nuevosPuntos) && !isNaN(nuevasPartidas)) {
        jugador.puntos = nuevosPuntos;
        jugador.partidas = nuevasPartidas;
        guardarDatos();
    } else {
        alert("❌ Por favor, introduce solo números válidos.");
    }
}

function eliminarJugador(id) {
    if(confirm("¿Seguro que quieres borrar a este jugador? Se perderán sus puntos.")) {
        jugadores = jugadores.filter(j => j.id !== id);
        guardarDatos();
    }
}

// --- ALGORITMO INTELIGENTE DE MESAS Y SUIZO ---
function generarMesas(modo = 'aleatorio') {
    const checkboxes = document.querySelectorAll('.check-jugador:checked');
    let presentes = Array.from(checkboxes).map(cb => jugadores.find(j => j.id == cb.value));
    const P = presentes.length;

    if (P < 3) { alert("Hacen falta al menos 3 jugadores para formar una mesa de Commander."); return; }

    let nombreJornada = jornadasLista[indiceJornadaActual];
    let puntosHoy = {};
    let partidasHoy = {}; 
    let sumatorioPuntosHoy = 0; 

    presentes.forEach(j => {
        puntosHoy[j.id] = 0;
        partidasHoy[j.id] = 0;
    });
    
    historial.forEach(h => {
        let fechaPartida = h.fecha.split(',')[0].trim();
        if (fechaPartida === nombreJornada) {
            h.resultados.forEach(r => {
                if (puntosHoy[r.idJugador] !== undefined) {
                    puntosHoy[r.idJugador] += r.puntos;
                    partidasHoy[r.idJugador] += 1; 
                    sumatorioPuntosHoy += r.puntos;
                }
            });
        }
    });

    let rondaActual = Math.max(...Object.values(partidasHoy)) + 1;

    for (let i = P - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [presentes[i], presentes[j]] = [presentes[j], presentes[i]];
    }

    if (modo === 'suizo') {
        if (sumatorioPuntosHoy === 0) {
            alert("🎲 Primera ronda detectada: Como nadie tiene puntos aún hoy, las mesas se han generado de forma totalmente aleatoria (ignorando el Suizo).");
        } else {
            presentes.sort((a, b) => {
                if (puntosHoy[b.id] !== puntosHoy[a.id]) {
                    return puntosHoy[b.id] - puntosHoy[a.id];
                }
                return b.puntos - a.puntos;
            });
        }
    }

    let mesas_de_4 = Math.floor(P / 4);
    let mesas_de_3 = 0;
    let mesas_de_5 = 0;
    let resto = P % 4;

    if (resto === 1) {
        if (mesas_de_4 === 1) { mesas_de_4 = 0; mesas_de_5 = 1; } 
        else if (mesas_de_4 === 2) { mesas_de_4 = 0; mesas_de_3 = 3; } 
        else { mesas_de_4 -= 2; mesas_de_3 += 3; }
    } else if (resto === 2) { mesas_de_4 -= 1; mesas_de_3 += 2;
    } else if (resto === 3) { mesas_de_3 += 1; }

    let mesas = [];
    let indexJugador = 0;

    for (let i = 0; i < mesas_de_4; i++) { mesas.push(presentes.slice(indexJugador, indexJugador + 4)); indexJugador += 4; }
    for (let i = 0; i < mesas_de_3; i++) { mesas.push(presentes.slice(indexJugador, indexJugador + 3)); indexJugador += 3; }
    for (let i = 0; i < mesas_de_5; i++) { mesas.push(presentes.slice(indexJugador, indexJugador + 5)); indexJugador += 5; }

    ultimasMesasGeneradas = mesas;
    mostrarMesas(mesas, modo, puntosHoy, rondaActual);
}

function mostrarMesas(mesas, modo = 'aleatorio', puntosHoy = {}, rondaActual = 1) {
    const contenedor = document.getElementById('mesas-generadas');
    contenedor.innerHTML = '';

    if(mesas.length > 0) {
        contenedor.innerHTML += `<button class="btn-tv" onclick="abrirModoTV()">📺 PROYECTAR EN TV</button>`;
    }

    let tituloMesa = modo === 'suizo' ? `🏆 Suizo (Ronda ${rondaActual}) - Mesa` : `🔮 Aleatorio (Ronda ${rondaActual}) - Mesa`;
    let colorTitulo = modo === 'suizo' ? '#ef4444' : '#a855f7';

    mesas.forEach((mesa, index) => {
        let html = `<div class="pod" id="pod-${index}">
            <h3 style="color: ${colorTitulo}; margin-bottom: 5px;">${tituloMesa} ${index + 1} <span style="font-size:12px; color:#94a3b8; font-weight:normal;">(${mesa.length} Jugadores)</span></h3>`;
        
        const nombresMesa = mesa.map(j => {
            let textoPuntos = modo === 'suizo' ? ` <span style="color:#fcd34d; font-size:11px; font-weight:normal;">(${puntosHoy[j.id]}p hoy | ${j.puntos}p gen)</span>` : '';
            return `${j.nombre}${textoPuntos}`;
        }).join(' <span style="color:#64748b;">•</span> ');
        
        html += `<div class="nombres-mesa" style="margin-top: 10px;">⚡ ${nombresMesa}</div>`;
        
        for(let i=0; i < mesa.length; i++) {
            html += `<label>${i+1}º PUESTO (+${puntosGlobales[i]} PTS):</label>
                     <select id="sel-pod-${index}-pos-${i}" onchange="actualizarDesplegables('pod-${index}', ${mesa.length})">
                        <option value="">-- Selecciona jugador --</option>`;
            mesa.forEach(jugador => {
                html += `<option value="${jugador.id}">${jugador.nombre}</option>`;
            });
            html += `</select>`;
        }

        // --- BOTONES DOBLES: GUARDAR Y EMPATAR ---
        html += `<div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn-save-pod" style="flex: 2;" onclick="guardarResultadoMesa('pod-${index}', ${mesa.length})">💾 Confirmar</button>
                    <button class="btn-tie" style="flex: 1.5; background: linear-gradient(135deg, #64748b, #475569);" onclick="declararEmpate('pod-${index}', ${mesa.length})">⏱️ Empatar Mesa</button>
                 </div></div>`;
                 
        contenedor.innerHTML += html;
    });
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function abrirModoTV() {
    if(ultimasMesasGeneradas.length === 0) { alert("Genera las mesas primero."); return; }
    if (!ventanaTV || ventanaTV.closed) { ventanaTV = window.open("", "VentanaTVCommander", "width=1280,height=720"); }

    let htmlPods = "";
    ultimasMesasGeneradas.forEach((mesa, index) => {
        let delay = index * 0.15; 
        htmlPods += `<div class="tv-pod" style="animation-delay: ${delay}s"><h3>MESA ${index + 1}</h3>`;
        mesa.forEach(jugador => { htmlPods += `<div class="tv-player"><span class="tv-icon">⚡</span> ${jugador.nombre}</div>`; });
        htmlPods += `</div>`;
    });

    const htmlPantallaTV = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Emparejamientos - TV</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;700;900&display=swap" rel="stylesheet">
            <style>
                ::-webkit-scrollbar { display: none; }
                body { -ms-overflow-style: none; scrollbar-width: none; background: #09090e; color: white; font-family: 'Poppins', sans-serif; margin: 0; min-height: 100vh; overflow-y: auto; overflow-x: hidden; position: relative; cursor: pointer; }
                .bg-auras { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; pointer-events: none; }
                .aura { position: absolute; border-radius: 50%; filter: blur(150px); opacity: 0.5; animation: floatAura 20s infinite alternate ease-in-out; }
                .aura-1 { width: 60vw; height: 60vw; background: #5b21b6; top: -20%; left: -10%; }
                .aura-2 { width: 50vw; height: 50vw; background: #1e3a8a; bottom: -20%; right: -10%; animation-delay: -5s; }
                @keyframes floatAura { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(60px, 40px) scale(1.1); } }
                #start-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; display: flex; justify-content: center; align-items: center; cursor: pointer; background: transparent; }
                .click-prompt { font-size: 1.5rem; color: rgba(255,255,255,0.6); letter-spacing: 4px; font-weight: 300; text-transform: uppercase; text-align: center; animation: pulsePrompt 2s infinite ease-in-out; }
                @keyframes pulsePrompt { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
                #main-content { padding: 60px 40px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; position: relative; }
                .tv-title { font-size: 5rem; font-weight: 900; margin-bottom: 70px; text-align: center; background: linear-gradient(to right, #c084fc, #60a5fa, #c084fc); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 8px; filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.4)); animation: shineTitle 4s linear infinite; opacity: 0; transform: translateY(-30px); transition: all 1s ease-out; }
                .is-playing .tv-title { opacity: 1; transform: translateY(0); }
                @keyframes shineTitle { to { background-position: 200% center; } }
                .tv-grid { display: flex; flex-wrap: wrap; gap: 50px; justify-content: center; width: 100%; max-width: 1900px; }
                .tv-pod { background: rgba(15, 15, 20, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 30px; padding: 50px 40px; min-width: 400px; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(139, 92, 246, 0.15); position: relative; overflow: hidden; backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); opacity: 0; transform: translateY(100px) scale(0.9); }
                .is-playing .tv-pod { animation: cardEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                @keyframes cardEnter { to { opacity: 1; transform: translateY(0) scale(1); } }
                .tv-pod::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: linear-gradient(90deg, #f59e0b, #d97706); box-shadow: 0 0 20px #f59e0b; }
                .tv-pod h3 { font-size: 3rem; color: #f59e0b; margin: 0 0 40px 0; font-weight: 900; letter-spacing: 3px; text-shadow: 0 0 15px rgba(245, 158, 11, 0.3); }
                .tv-player { font-size: 2.4rem; color: #f8fafc; margin: 25px 0; font-weight: 700; border-bottom: 2px solid rgba(255,255,255,0.05); padding-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 15px; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }
                .tv-player:last-child { border-bottom: none; }
                .tv-icon { color: #8b5cf6; font-size: 2rem; filter: drop-shadow(0 0 10px rgba(139,92,246,0.6)); }
            </style>
        </head>
        <body onclick="this.classList.add('is-playing'); document.getElementById('start-overlay').style.display='none'; this.style.cursor='default';">
            <div id="start-overlay"><div class="click-prompt">Haz clic en cualquier parte para iniciar...</div></div>
            <div id="main-content">
                <div class="bg-auras"><div class="aura aura-1"></div><div class="aura aura-2"></div></div>
                <div class="tv-title">EMPAREJAMIENTOS</div>
                <div class="tv-grid">${htmlPods}</div>
            </div>
        </body>
        </html>
    `;
    ventanaTV.document.open();
    ventanaTV.document.write(htmlPantallaTV);
    ventanaTV.document.close();
    ventanaTV.focus();
}

function crearMesaManual() {
    if(jugadores.length < 3) { alert("Añade jugadores primero."); return; }
    const contenedor = document.getElementById('mesas-generadas');
    let html = `<div class="pod manual" id="manual-${contadorManual}"><h3 style="color:#a855f7;">✍️ Mesa Manual</h3><p style="font-size:13px; color:#94a3b8; margin-top:-10px; margin-bottom: 20px;">Asigna las posiciones libremente.</p>`;
    for(let i=0; i < 5; i++) {
        let opcional = i >= 3 ? " <span style='font-weight:normal; text-transform:none; color:#64748b;'>(Opcional)</span>" : "";
        html += `<label>${i+1}º PUESTO (+${puntosGlobales[i]} PTS) ${opcional}:</label><select id="sel-manual-${contadorManual}-pos-${i}" onchange="actualizarDesplegables('manual-${contadorManual}', 5)"><option value="">-- Elige un jugador --</option>`;
        jugadores.forEach(jugador => { html += `<option value="${jugador.id}">${jugador.nombre}</option>`; });
        html += `</select>`;
    }
    html += `<div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn-save-pod" style="flex: 2;" onclick="guardarResultadoMesa('manual-${contadorManual}', 5)">💾 Confirmar</button>
                <button class="btn-tie" style="flex: 1.5; background: linear-gradient(135deg, #64748b, #475569);" onclick="declararEmpate('manual-${contadorManual}', 5)">⏱️ Empatar Mesa</button>
             </div></div>`;
    contenedor.insertAdjacentHTML('afterbegin', html);
    contadorManual++;
}

function actualizarDesplegables(prefijoMesa, numPuestos) {
    let selects = [];
    for (let i = 0; i < numPuestos; i++) {
        let s = document.getElementById(`sel-${prefijoMesa}-pos-${i}`);
        if (s) selects.push(s);
    }
    let seleccionados = selects.map(s => s.value).filter(v => v !== "");
    selects.forEach(select => {
        let valorActual = select.value;
        Array.from(select.options).forEach(opt => {
            if (opt.value === "") return;
            if (seleccionados.includes(opt.value) && opt.value !== valorActual) {
                opt.disabled = true; opt.text = opt.text.replace(" (Ya asignado)", "") + " (Ya asignado)";
            } else {
                opt.disabled = false; opt.text = opt.text.replace(" (Ya asignado)", "");
            }
        });
    });
}

function guardarResultadoMesa(prefijoMesa, numJugadores) {
    let idsSeleccionados = new Set();
    let detallesMesa = [];

    for(let i=0; i < numJugadores; i++) {
        const selectEl = document.getElementById(`sel-${prefijoMesa}-pos-${i}`);
        if(!selectEl) continue;

        const idJugador = selectEl.value;
        if(!idJugador) {
            if (i < 3) { alert(`Falta asignar el ${i+1}º puesto.`); return; } 
            else { continue; }
        }

        if(idsSeleccionados.has(idJugador)) { alert("¡Error de sistema! Jugador duplicado."); return; }
        idsSeleccionados.add(idJugador);

        const nombreLimpio = selectEl.options[selectEl.selectedIndex].text.replace(" (Ya asignado)", "");
        detallesMesa.push({ idJugador: idJugador, nombre: nombreLimpio, puntos: puntosGlobales[i], posicion: i + 1 });
    }
    procesarGuardado(detallesMesa, prefijoMesa.includes('pod') ? prefijoMesa : prefijoMesa);
}

// --- NUEVA LÓGICA: CALCULADORA OFICIAL DE EMPATES ---
function declararEmpate(prefijoMesa, numJugadores) {
    let idsAsignados = new Set();
    let detallesMesa = [];
    let puntosUsados = 0;
    let selectBase = null;

    // 1. Identificar a quién ya se le asignó puesto (los que murieron antes del tiempo)
    for(let i=0; i < numJugadores; i++) {
        const selectEl = document.getElementById(`sel-${prefijoMesa}-pos-${i}`);
        if(!selectBase && selectEl) selectBase = selectEl; // Capturamos el listado de jugadores
        
        if(selectEl && selectEl.value) {
            idsAsignados.add(selectEl.value);
            const nombreLimpio = selectEl.options[selectEl.selectedIndex].text.replace(" (Ya asignado)", "");
            detallesMesa.push({ idJugador: selectEl.value, nombre: nombreLimpio, puntos: puntosGlobales[i], posicion: i + 1 });
            puntosUsados += puntosGlobales[i];
        }
    }

    // 2. Obtener a todos los jugadores asignados a esa mesa inicialmente
    let todosIds = [];
    let todosNombres = {};
    Array.from(selectBase.options).forEach(opt => {
        if(opt.value !== "") {
            todosIds.push(opt.value);
            todosNombres[opt.value] = opt.text.replace(" (Ya asignado)", "");
        }
    });

    // 3. Encontrar quiénes son los empatados (los que no tienen puesto todavía)
    let idsRestantes = todosIds.filter(id => !idsAsignados.has(id));

    if (idsRestantes.length === 0) {
        alert("❌ Todos los jugadores ya tienen posición. Para empatar, tienes que dejar los desplegables de los que empatan en blanco.");
        return;
    }
    if (idsRestantes.length === 1) {
        alert("❌ Solo queda 1 jugador sin asignar. Asígnalo normalmente en el desplegable.");
        return;
    }

    // 4. Matemáticas oficiales: Puntos Sobrantes / Empatados (redondeando abajo)
    let puntosTotalesMesa = 0;
    for(let i=0; i < numJugadores; i++) puntosTotalesMesa += puntosGlobales[i];
    
    let puntosRestantes = puntosTotalesMesa - puntosUsados;
    let puntosPorEmpate = Math.floor(puntosRestantes / idsRestantes.length);

    // Asignar los puntos del empate
    idsRestantes.forEach(id => {
        detallesMesa.push({ idJugador: id, nombre: todosNombres[id], puntos: puntosPorEmpate, posicion: "Empate" });
    });

    // 5. Ventana de confirmación para que el organizador lo verifique
    let mensaje = "⏱️ CÁLCULO DE EMPATE OFICIAL:\n\n";
    detallesMesa.forEach(d => {
        mensaje += `> ${d.nombre}: ${d.puntos} puntos (Posición: ${d.posicion})\n`;
    });
    mensaje += `\n¿Guardar este resultado en el historial?`;

    if(confirm(mensaje)) {
        procesarGuardado(detallesMesa, prefijoMesa.includes('pod') ? prefijoMesa : prefijoMesa);
    }
}

function procesarGuardado(detallesMesa, idElemento) {
    detallesMesa.forEach(detalle => {
        let jugador = jugadores.find(j => j.id == detalle.idJugador);
        jugador.puntos += detalle.puntos;
        jugador.partidas += 1;
    });

    let nombreJornada = jornadasLista[indiceJornadaActual] || "J1";
    let fechaGuardado = `${nombreJornada}, ${new Date().toLocaleTimeString()}`;

    historial.unshift({ id: Date.now(), fecha: fechaGuardado, resultados: detallesMesa });
    
    let sufijo = idElemento.includes('pod') ? idElemento : `manual-${idElemento.split('-')[1]}`;
    const mesaGuardada = document.getElementById(idElemento.includes('pod') ? idElemento : idElemento);
    if(mesaGuardada) {
        mesaGuardada.style.opacity = '0';
        setTimeout(() => { mesaGuardada.style.display = 'none'; }, 300);
    }
    guardarDatos(); 
}

function anularResultado(idHistorial) {
    if(!confirm("¿Anular mesa y restar puntos?")) return;
    const index = historial.findIndex(h => h.id === idHistorial);
    if(index === -1) return;
    
    historial[index].resultados.forEach(detalle => {
        let jugador = jugadores.find(j => j.id == detalle.idJugador);
        if(jugador) {
            jugador.puntos = Math.max(0, jugador.puntos - detalle.puntos);
            jugador.partidas = Math.max(0, jugador.partidas - 1);
        }
    });
    historial.splice(index, 1);
    guardarDatos();
}

function exportarDatos() {
    const blob = new Blob([JSON.stringify({ jugadores, historial }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Liga_Commander_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    a.click();
}

function importarDatos(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            if (datos.jugadores && datos.historial && confirm("⚠️ Esto sobreescribirá los datos actuales. ¿Continuar?")) {
                jugadores = datos.jugadores;
                historial = datos.historial;
                guardarDatos(); 
            }
        } catch (error) { alert("❌ Archivo no válido."); }
        event.target.value = '';
    };
    lector.readAsText(archivo);
}

function reiniciarApp() {
    if (prompt("Escribe BORRAR para eliminar todo:") === "BORRAR") {
        jugadores = []; historial = [];
        localStorage.removeItem('commander_jugadores');
        localStorage.removeItem('commander_historial');
        document.getElementById('mesas-generadas').innerHTML = '';
        actualizarUI();
    }
}

function actualizarFiltroFechas() {
    const select = document.getElementById('modo-clasificacion');
    
    if (isModoEdicionExcel) return; 

    const valorActual = select.value;

    let fechasUnicas = new Set();
    historial.forEach(h => {
        let fecha = h.fecha.split(',')[0].trim(); 
        fechasUnicas.add(fecha);
    });

    let opcionesHTML = `<option value="general">🌟 Clasificación General</option>`;
    opcionesHTML += `<option value="excel">📊 Vista Detallada (Excel)</option>`; 
    
    let jornadasOrdenadas = Array.from(fechasUnicas).sort((a, b) => {
        let numA = a.match(/\d+/) ? parseInt(a.match(/\d+/)[0]) : NaN;
        let numB = b.match(/\d+/) ? parseInt(b.match(/\d+/)[0]) : NaN;
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.localeCompare(b);
    });

    jornadasOrdenadas.forEach(fecha => {
        opcionesHTML += `<option value="${fecha}">📅 ${fecha}</option>`;
    });

    select.innerHTML = opcionesHTML;
    if (Array.from(select.options).some(opt => opt.value === valorActual)) {
        select.value = valorActual;
    } else {
        select.value = 'general';
    }
}

function renderizarClasificacion() {
    const modo = isModoEdicionExcel ? 'excel' : document.getElementById('modo-clasificacion').value;
    const bodyClasificacion = document.getElementById('body-clasificacion');
    const theadClasificacion = document.querySelector('#tabla-clasificacion thead');
    let datosClasificacion = [];

    if (modo === 'excel') {
        let jornadasUnicas = [];
        historial.forEach(h => {
            let fecha = h.fecha.split(',')[0].trim();
            if (!jornadasUnicas.includes(fecha)) { jornadasUnicas.push(fecha); }
        });
        
        jornadasUnicas.sort((a, b) => {
            let numA = a.match(/\d+/) ? parseInt(a.match(/\d+/)[0]) : NaN;
            let numB = b.match(/\d+/) ? parseInt(b.match(/\d+/)[0]) : NaN;
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            if (!isNaN(numA)) return -1;
            if (!isNaN(numB)) return 1;
            return a.localeCompare(b);
        });

        let statsTemp = {};
        jugadores.forEach(j => {
            statsTemp[j.id] = { id: j.id, nombre: j.nombre, totalGuardado: j.puntos, sumaHistorial: 0, previo: 0, jornadas: {} };
            jornadasUnicas.forEach(jor => statsTemp[j.id].jornadas[jor] = 0);
        });

        historial.forEach(h => {
            let fechaPartida = h.fecha.split(',')[0].trim();
            h.resultados.forEach(r => {
                if (statsTemp[r.idJugador]) {
                    statsTemp[r.idJugador].jornadas[fechaPartida] += r.puntos;
                    statsTemp[r.idJugador].sumaHistorial += r.puntos;
                }
            });
        });

        let mostrarPrevio = false;
        Object.values(statsTemp).forEach(st => {
            st.previo = st.totalGuardado - st.sumaHistorial;
            if (st.previo !== 0) mostrarPrevio = true;
        });

        let theadHTML = `<tr><th>Pos</th><th style="text-align:left;">Jugador</th>`;
        if (mostrarPrevio || isModoEdicionExcel) {
            theadHTML += `<th style="color: #94a3b8;" title="Puntos de jornadas antiguas">Base</th>`;
        }
        jornadasUnicas.forEach(j => { theadHTML += `<th>${j}</th>`; });
        theadHTML += `<th style="color: var(--primary);">Total</th></tr>`;
        theadClasificacion.innerHTML = theadHTML;

        datosClasificacion = Object.values(statsTemp).filter(j => isModoEdicionExcel || j.totalGuardado !== 0 || j.sumaHistorial !== 0 || j.previo !== 0);
        datosClasificacion.sort((a, b) => b.totalGuardado - a.totalGuardado);

        if(datosClasificacion.length === 0) {
            bodyClasificacion.innerHTML = `<tr><td colspan="100%" style="color:#64748b; font-style:italic; padding: 25px;">No hay jugadores.</td></tr>`;
            return;
        }

        let limite = mostrarTodosJugadores ? datosClasificacion.length : 15;
        let filasHTML = datosClasificacion.slice(0, limite).map((j, i) => {
            let medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
            let claseColor = i === 0 ? "oro" : i === 1 ? "plata" : i === 2 ? "bronce" : "";
            let claseFila = i === 0 ? "rango-1" : i === 1 ? "rango-2" : i === 2 ? "rango-3" : "";
            
            let row = `<tr class="${claseFila}">
                <td style="color:#64748b; font-weight:700;">${i + 1}</td>
                <td style="text-align: left; font-weight: 600; font-size: 15px; color: white;"><span style="margin-right:12px; font-size:1.2rem;">${medalla}</span> ${j.nombre}</td>`;
            
            if (mostrarPrevio || isModoEdicionExcel) {
                if (isModoEdicionExcel) {
                    row += `<td><input type="number" class="excel-cell" data-jid="${j.id}" data-jor="BASE" value="${j.previo}" oninput="actualizarFilaExcel(this)"></td>`;
                } else {
                    row += `<td style="color:#94a3b8; font-size:13px; font-weight:600;">${j.previo !== 0 ? j.previo : '-'}</td>`;
                }
            }

            jornadasUnicas.forEach(jor => {
                let pts = j.jornadas[jor];
                if (isModoEdicionExcel) {
                    row += `<td><input type="number" class="excel-cell" data-jid="${j.id}" data-jor="${jor}" value="${pts}" oninput="actualizarFilaExcel(this)"></td>`;
                } else {
                    row += `<td style="color:#cbd5e1; font-size:14px;">${pts !== 0 ? pts : '-'}</td>`;
                }
            });

            row += `<td class="puntos-destacados excel-total ${claseColor}" style="font-weight:700; font-size:1.2rem; background: rgba(139, 92, 246, 0.1); border-radius: 0 12px 12px 0;">${j.totalGuardado}</td></tr>`;
            return row;
        }).join('');
        
        if (datosClasificacion.length > 15 && !isModoEdicionExcel) {
            let textBtn = mostrarTodosJugadores ? "Ocultar Jugadores" : `Mostrar los ${datosClasificacion.length - 15} jugadores restantes ▼`;
            filasHTML += `<tr><td colspan="100%" style="padding:0;"><button class="btn-ver-mas" onclick="toggleMostrarTodos()">${textBtn}</button></td></tr>`;
        }
        bodyClasificacion.innerHTML = filasHTML;

    } else {
        theadClasificacion.innerHTML = `<tr><th>Pos</th><th style="text-align:left;">Jugador</th><th>Puntos</th><th>Partidas</th></tr>`;

        if (modo === 'general') {
            datosClasificacion = [...jugadores];
        } else {
            let statsTemp = {};
            jugadores.forEach(j => statsTemp[j.id] = { ...j, puntos: 0, partidas: 0 });

            historial.forEach(h => {
                let fechaPartida = h.fecha.split(',')[0].trim();
                if (fechaPartida === modo) {
                    h.resultados.forEach(r => {
                        if (statsTemp[r.idJugador]) {
                            statsTemp[r.idJugador].puntos += r.puntos;
                            if(r.posicion !== "-") { statsTemp[r.idJugador].partidas += 1; }
                        }
                    });
                }
            });
            datosClasificacion = Object.values(statsTemp).filter(j => j.puntos !== 0 || j.partidas > 0);
        }

        let ordenados = datosClasificacion.sort((a, b) => b.puntos - a.puntos);

        if(ordenados.length === 0) {
            bodyClasificacion.innerHTML = `<tr><td colspan="4" style="color:#64748b; font-style:italic; padding: 25px;">No hay batallas registradas en esta vista.</td></tr>`;
            return;
        }

        let limite = mostrarTodosJugadores ? ordenados.length : 15;
        let filasHTML = ordenados.slice(0, limite).map((j, i) => {
            let medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
            let claseColor = i === 0 ? "oro" : i === 1 ? "plata" : i === 2 ? "bronce" : "";
            let claseFila = i === 0 ? "rango-1" : i === 1 ? "rango-2" : i === 2 ? "rango-3" : "";
            
            return `<tr class="${claseFila}">
                <td style="color:#64748b; font-weight:700;">${i + 1}</td>
                <td style="text-align: left; font-weight: 600; font-size: 15px; color: white;"><span style="margin-right:12px; font-size:1.2rem;">${medalla}</span> ${j.nombre}</td>
                <td class="puntos-destacados ${claseColor}" style="font-weight:700; font-size:1.2rem;">${j.puntos}</td>
                <td style="color:#64748b;">${j.partidas} jugadas</td>
            </tr>`;
        }).join('');

        if (ordenados.length > 15) {
            let textBtn = mostrarTodosJugadores ? "Ocultar Jugadores" : `Mostrar los ${ordenados.length - 15} jugadores restantes ▼`;
            filasHTML += `<tr><td colspan="100%" style="padding:0;"><button class="btn-ver-mas" onclick="toggleMostrarTodos()">${textBtn}</button></td></tr>`;
        }
        bodyClasificacion.innerHTML = filasHTML;
    }
}

function actualizarUI() {
    document.getElementById('lista-jugadores').innerHTML = jugadores.map(j => 
        `<li>
            <div>
                <strong style="font-size: 15px;">${j.nombre}</strong>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-delete" onclick="eliminarJugador(${j.id})">BORRAR</button>
            </div>
        </li>`
    ).join('');

    const checkboxesActivos = document.querySelectorAll('.check-jugador:checked');
    const idsActivos = new Set(Array.from(checkboxesActivos).map(cb => parseInt(cb.value)));

    document.getElementById('jugadores-presentes').innerHTML = jugadores.map(j => {
        let marcado = idsActivos.has(j.id) ? 'checked' : '';
        return `<label><input type="checkbox" class="check-jugador" value="${j.id}" ${marcado}> ${j.nombre}</label>`;
    }).join('');

    let guardadoJornada = localStorage.getItem('commander_jornada_activa');
    if(guardadoJornada !== null) {
        indiceJornadaActual = parseInt(guardadoJornada);
        if(isNaN(indiceJornadaActual) || indiceJornadaActual >= jornadasLista.length) indiceJornadaActual = 0;
    }
    document.getElementById('display-jornada').innerText = jornadasLista[indiceJornadaActual];

    actualizarFiltroFechas();
    renderizarClasificacion();

    const listaHistorial = document.getElementById('lista-historial');
    if(historial.length === 0) {
        listaHistorial.innerHTML = '<p style="color:#64748b; font-style:italic; padding: 10px;">Esperando la primera batalla...</p>';
    } else {
        let gruposPorFecha = {};
        let fechasOrdenadas = [];
        
        historial.forEach(h => {
            let fecha = h.fecha.split(',')[0].trim();
            if (!gruposPorFecha[fecha]) {
                gruposPorFecha[fecha] = [];
                fechasOrdenadas.push(fecha); 
            }
            gruposPorFecha[fecha].push(h);
        });

        let htmlHistorial = '';
        fechasOrdenadas.forEach((fecha, index) => {
            let openAttr = index === 0 ? 'open' : '';
            htmlHistorial += `<details class="historial-jornada" ${openAttr}><summary>📅 Jornada: ${fecha}</summary><div>`;
            gruposPorFecha[fecha].forEach(h => {
                let hora = h.fecha.split(',')[1] ? h.fecha.split(',')[1].trim() : '';
                let horaHtml = hora ? `<span class="historial-date">🕒 ${hora}</span>` : '';
                htmlHistorial += `
                    <div class="historial-item">
                        ${horaHtml}
                        <p>${h.resultados.map(r => `<strong style="color:var(--primary);">${r.posicion}º</strong> ${r.nombre} <span style="color:var(--success); font-size:12px;">(+${r.puntos})</span>`).join(' <span style="color:rgba(255,255,255,0.05); margin: 0 5px;">|</span> ')}</p>
                        <div style="text-align:right; margin-top: 5px;">
                            <button class="btn-delete" style="background:transparent; border:1px solid rgba(239, 68, 68, 0.3);" onclick="anularResultado(${h.id})">Anular</button>
                        </div>
                    </div>`;
            });
            htmlHistorial += `</div></details>`;
        });
        listaHistorial.innerHTML = htmlHistorial;
    }
}

document.addEventListener("DOMContentLoaded", actualizarUI);
