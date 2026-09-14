function mountFeedbackCoach(root, options = {}) {
  root.classList.add('fc-root');
  if (options.isTeams) root.dataset.teams = 'true';
  if (options.frameContext) root.dataset.teamsContext = options.frameContext;
  if (options.meetingId) root.dataset.meetingId = options.meetingId;

  const KEY='feedback_coach_ai_v1';
  const NAV=[
   ['dashboard','◆','Dashboard'],['live','●','Sesión en vivo','IA'],['feedback','✎','Feedback'],['om','◔','Oportunidades de Mejora'],['challenges','▣','Desafíos'],['follow','↻','Seguimiento Advisor'],['people','☰','Directorio'],['settings','⚙','Configuración']
  ];
  const TITLES={dashboard:['Dashboard','Visión ejecutiva del ciclo de feedback y desarrollo'],live:['Sesión en vivo','El asistente escucha, detecta brechas y recomienda la mejor siguiente pregunta'],feedback:['Feedback','Registros estructurados y sujetos a revisión humana'],om:['Oportunidades de Mejora','Brechas trazables en formato Situación · Comportamiento · Impacto'],challenges:['Desafíos','Feed-forward convertido en compromisos medibles'],follow:['Seguimiento Advisor','Cierre de loop después de cada feedback'],people:['Directorio','Maestro de personas, cliente, equipo y Advisor'],settings:['Configuración','Métricas, cobertura y reglas del coach']};
  const DIMS=[['context','Contexto'],['strength','Fortalezas'],['positiveEvidence','Evidencia positiva'],['om','OM'],['situation','Situación'],['behavior','Comportamiento'],['impact','Impacto'],['frequency','Frecuencia'],['expectation','Expectativa'],['challenge','Desafío'],['success','Criterio éxito'],['satisfaction','Satisfacción'],['recommend','Recomendación'],['metricsWhy','Motivo métricas']];
  const seed=()=>({
   seq:{p:3,f:2,o:2,c:2,m:1,a:1},
   people:[
    {id:1,name:'Persona Demo 1',email:'persona1@example.com',client:'Cliente A',unit:'Banca Digital',squad:'Squad Alpha',advisor:'Advisor Demo',status:'Activo'},
    {id:2,name:'Persona Demo 2',email:'persona2@example.com',client:'Cliente B',unit:'Medios de Pago',squad:'Squad Beta',advisor:'Advisor Demo',status:'Activo'},
    {id:3,name:'Persona Demo 3',email:'persona3@example.com',client:'Cliente A',unit:'Transformación',squad:'Squad Gamma',advisor:'Advisor Demo 2',status:'Activo'}
   ],
   feedback:[
    {id:1,personId:1,date:days(-18),client:'Cliente A',source:'Líder Demo',sourceRole:'Agile Coach',status:'3-Reviewed',sat:8,rec:7,summary:'Se reconoce solidez técnica y ownership. Se identifica una oportunidad en delegación durante periodos de alta carga.',approved:true},
    {id:2,personId:2,date:days(-42),client:'Cliente B',source:'Líder Demo 2',sourceRole:'Líder de Proyecto',status:'2-Delivered',sat:6,rec:6,summary:'Buena comunicación con stakeholders; se requiere mayor anticipación de riesgos.',approved:true}
   ],
   oms:[
    {id:1,personId:1,feedbackId:1,keyword:'Delegación tardía',competence:'Delegación',situation:'En sprints de alta carga',behavior:'Asume tareas que podrían distribuirse',impact:'Se vuelve cuello de botella en revisiones',state:'2-Deseo trabajarlo'},
    {id:2,personId:2,feedbackId:2,keyword:'Anticipación de riesgos',competence:'Comunicación',situation:'Antes de cierres críticos',behavior:'Comunica el riesgo cuando ya impactó la fecha',impact:'Reduce margen de reacción del equipo',state:'1-Soy consciente'}
   ],
   challenges:[
    {id:1,personId:1,title:'Delegar revisiones de PR',criteria:'80% de PR revisados por pares distintos durante 4 sprints',state:'En progreso',due:days(20)},
    {id:2,personId:2,title:'Comunicar riesgos con anticipación',criteria:'Riesgos críticos comunicados dentro de 24h de ser identificados por 4 semanas',state:'Por hacer',due:days(30)}
   ],
   meetings:[{id:1,personId:2,feedbackId:2,advisor:'Advisor Demo',date:days(4),done:false}],
   audit:[], config:{sessionMinutes:30,coverageTarget:75,questionMode:'private',metricScale:10}
  });
  function days(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
  let db;try{db=JSON.parse(localStorage.getItem(KEY))||seed()}catch(e){db=seed()}
  let state={view:'dashboard',session:null};
  const $=s=>root.querySelector(s); const $$=s=>Array.from(root.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function persist(){localStorage.setItem(KEY,JSON.stringify(db))}
  function person(id){return db.people.find(x=>String(x.id)===String(id))}
  function fmt(d){if(!d)return '—';const [y,m,dd]=d.split('-');return `${dd}/${m}/${y}`}
  function id(k){db.seq[k]=(db.seq[k]||0)+1;return db.seq[k]}
  function nav(){ $('#nav').innerHTML=NAV.map(n=>`<button data-v="${n[0]}" class="${state.view===n[0]?'active':''}"><span>${n[1]}</span>${n[2]}${n[3]?`<span class="tag">${n[3]}</span>`:''}</button>`).join(''); $$('[data-v]').forEach(b=>b.onclick=()=>{state.view=b.dataset.v;render()}) }
  function render(){nav();const t=TITLES[state.view];$('#title').textContent=t[0];$('#subtitle').textContent=t[1];({dashboard:renderDashboard,live:renderLive,feedback:renderFeedback,om:renderOM,challenges:renderChallenges,follow:renderFollow,people:renderPeople,settings:renderSettings}[state.view]||renderDashboard)()}
  function renderDashboard(){
   const openOM=db.oms.filter(o=>!['6-Superado','7-Archivado'].includes(o.state)).length;
   const inProg=db.challenges.filter(c=>c.state==='En progreso').length;
   const overdue=db.challenges.filter(c=>c.due<days(0)&&c.state!=='Hecho').length;
   const pending=db.meetings.filter(m=>!m.done).length;
   const view=$('#view'); view.innerHTML=`
   <div class="grid g4">
    ${kpi('Feedbacks',db.feedback.length,'registros totales')}${kpi('OM abiertas',openOM,'brechas en desarrollo')}${kpi('Desafíos activos',inProg,'en ejecución')}${kpi('Seguimientos',pending,'reuniones Advisor pendientes')}
   </div>
   <div class="grid g2" style="margin-top:16px">
    <div class="card"><h3>Casos que requieren atención</h3><div class="rank">${db.feedback.slice().sort((a,b)=>(a.sat+a.rec)-(b.sat+b.rec)).slice(0,5).map((f,i)=>`<div class="rankItem"><div class="n">${i+1}</div><div class="grow"><b>${esc(person(f.personId)?.name)}</b><small>${esc(f.client)} · ${fmt(f.date)}</small></div><span class="badge ${f.sat<=6?'bad':'warn'}">${f.sat}/10</span></div>`).join('')||'<div class="empty">Sin feedback todavía.</div>'}</div></div>
    <div class="card"><h3>Próximos pasos</h3><div class="rank">${db.meetings.filter(m=>!m.done).map((m,i)=>`<div class="rankItem"><div class="n">↻</div><div class="grow"><b>${esc(person(m.personId)?.name)}</b><small>Advisor: ${esc(m.advisor)} · ${fmt(m.date)}</small></div><span class="badge agentb">Pendiente</span></div>`).join('')||'<div class="empty">No hay seguimientos pendientes.</div>'}</div></div>
   </div>
   <div class="card" style="margin-top:16px"><div class="toolbar"><div><h3 style="margin:0">MVP conversacional</h3><span class="muted mini">La pieza central es elevar la calidad del feedback mientras ocurre.</span></div><div class="spacer"></div><button class="btn agent" id="goLive">▶ Iniciar sesión de prueba</button></div>
   <div class="grid g4">${miniStep('1','Escuchar','Transcripción viva')}${miniStep('2','Desafiar','Next Best Question')}${miniStep('3','Estructurar','Feedback + SBI + métricas')}${miniStep('4','Cerrar loop','Advisor + desafío')}</div></div>`;
   $('#goLive').onclick=()=>{state.view='live';render()}
  }
  function kpi(l,v,f){return `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="foot">${f}</div></div>`}
  function miniStep(n,t,d){return `<div style="padding:10px 0"><span class="badge agentb">${n}</span><div style="font-weight:800;margin-top:7px">${t}</div><div class="muted mini">${d}</div></div>`}
  function renderLive(){ if(!state.session) return renderSetup(); if(state.session.closed) return renderResult(); return renderSession(); }
  function renderSetup(){
   $('#view').innerHTML=`<div class="grid g2"><div class="card"><span class="pill">● Feedback Coach</span><h3 style="font-size:22px;margin-top:14px">Preparar sesión</h3><p class="muted">El colaborador evaluado no participa de esta primera sesión. El asistente acompaña privadamente al facilitador NTT DATA y recomienda preguntas según las brechas de información.</p>
   <div class="formgrid" style="margin-top:18px">
   <label class="field wide"><span>Talento evaluado</span><select id="sp"><option value="">Selecciona…</option>${db.people.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.client)}</option>`).join('')}</select></label>
   <label class="field"><span>Cliente</span><input id="sc" placeholder="Cliente A, Cliente B…"></label><label class="field"><span>Duración objetivo</span><input id="sd" type="number" min="10" max="90" value="${db.config.sessionMinutes}"></label>
   <label class="field"><span>Facilitador NTT DATA</span><input id="sf" value="Erick Merino"></label><label class="field"><span>Rol NTT DATA</span><input id="sfr" value="Líder de Servicio"></label>
   <label class="field"><span>Contraparte cliente</span><input id="ss" value="Líder Demo"></label><label class="field"><span>Rol contraparte</span><input id="ssr" value="Agile Coach"></label>
   </div><div class="toolbar" style="margin-top:16px"><button class="btn agent" id="start">▶ Iniciar sesión</button><button class="btn" id="demoStart">Cargar demo guiada</button></div></div>
   <div class="card"><h3>Qué hará el asistente</h3><div class="reviewItem"><b>1. Escucha</b><div class="muted mini">Mantiene transcripción y contexto acumulado.</div></div><div class="reviewItem"><b>2. Evalúa cobertura</b><div class="muted mini">Sabe qué ya está sustentado y qué falta.</div></div><div class="reviewItem"><b>3. Recomienda una sola pregunta</b><div class="muted mini">No convierte la sesión en formulario.</div></div><div class="reviewItem"><b>4. Estructura la salida</b><div class="muted mini">Reconocimientos, OM-SBI, desafíos, métricas y resumen.</div></div><div class="notice">POC: la escucha se simula ingresando la transcripción. La integración real de audio/Teams requiere backend corporativo.</div></div></div>`;
   $('#sp').onchange=e=>{const p=person(e.target.value); if(p)$('#sc').value=p.client||''};
   $('#start').onclick=()=>start(false); $('#demoStart').onclick=()=>start(true);
   function start(demo){const pid=$('#sp').value||3;const p=person(pid);state.session=newSession({personId:+pid,client:$('#sc').value||p?.client||'Cliente A',duration:+$('#sd').value||30,fac:$('#sf').value,facRole:$('#sfr').value,source:$('#ss').value,sourceRole:$('#ssr').value});render();if(demo)setTimeout(()=>loadDemo(),50)}
  }
  function newSession(c){return {cfg:c,started:Date.now(),transcript:[],coverage:Object.fromEntries(DIMS.map(d=>[d[0],'missing'])),facts:{strengths:[],positive:[],om:[],situation:[],behavior:[],impact:[],frequency:[],expectation:[],challenge:[],success:[],metricsWhy:[]},metrics:{sat:null,rec:null,collab:null,performance:null,proactivity:null,valueFeedback:null},qAlt:0,closed:false,approved:false,result:null}}
  function loadDemo(){
   const lines=[
    ['client','En general María Luisa está trabajando bien.'],
    ['fac','¿Qué situación reciente te hace decir que está trabajando bien?'],
    ['client','La semana pasada tuvimos una caída en producción y ella tomó el liderazgo para ordenar al equipo.'],
    ['client','Coordinó a los desarrolladores, habló con infraestructura y mantuvo informado al negocio. Eso permitió recuperar el servicio rápido y evitó una escalada mayor.'],
    ['client','Sí veo una oportunidad: a veces comunica los riesgos demasiado tarde.'],
    ['fac','¿Puedes contarme una situación concreta en la que eso haya ocurrido?'],
    ['client','En el último sprint detectó una dependencia con otro equipo dos días antes del cierre y recién la comunicó cuando la fecha ya estaba comprometida.'],
    ['client','Eso nos dejó sin margen para negociar el alcance y generó tensión con el Product Owner.'],
    ['client','Me gustaría que lo comunique apenas identifique el riesgo, no cuando ya sea un bloqueo.'],
    ['client','Como desafío, podría levantar los riesgos relevantes en las dailies y asegurar que el owner los conozca el mismo día.'],
    ['client','Diría que estaría cumplido si durante un mes no tenemos riesgos críticos comunicados tarde.'],
    ['client','En satisfacción le pondría 8 de 10 y en recomendación 9 de 10 porque aporta mucho valor, solo necesita anticiparse más.']
   ];
   lines.forEach((x,i)=>setTimeout(()=>{if(!state.session||state.session.closed)return;addLine(x[0],x[1]);renderSession()},i*180));
  }
  function addLine(who,text){const s=state.session;s.transcript.push({who,text,at:new Date().toISOString()});if(who==='client')analyze(text)}
  function mark(k,status='complete'){const c=state.session.coverage;const rank={missing:0,partial:1,complete:2};if(rank[status]>rank[c[k]])c[k]=status}
  function has(text,arr){const t=text.toLowerCase();return arr.some(w=>t.includes(w))}
  function pushFact(k,text){const a=state.session.facts[k];if(!a.includes(text))a.push(text)}
  function analyze(text){const t=text.toLowerCase(); const n=(t.match(/\b10\b|\b[1-9]\b/g)||[]).map(Number);
   mark('context','partial');
   if(has(t,['bien','destac','logr','fortaleza','excelente','lider','ownership','valor'])){mark('strength');pushFact('strengths',text)}
   if(has(t,['semana pasada','último sprint','ultimo sprint','ayer','cuando ','en producción','en produccion','durante','en la reunión','en la reunion'])){mark('situation');mark('context');pushFact('situation',text)}
   if(has(t,['coordin','comunic','tomó','tomo','hizo','dejó','dejo','resolv','organizó','organizo','asum','mantuvo','levant'])){mark('behavior');pushFact('behavior',text)}
   if(has(t,['permitió','permitio','generó','genero','provocó','provoco','impact','evitó','evito','retras','tensión','tension','margen','resultado'])){mark('impact');pushFact('impact',text)}
   if(state.session.coverage.strength==='complete'&&state.session.coverage.situation==='complete'&&state.session.coverage.behavior==='complete'&&state.session.coverage.impact==='complete'){mark('positiveEvidence');pushFact('positive',text)}
   if(has(t,['oportunidad','mejorar','mejora','debería','deberia','le falta','necesita','demasiado tarde','tarde','no cumpl'])){mark('om');pushFact('om',text)}
   if(has(t,['a veces','siempre','frecuent','varias veces','una vez','esporád','esporad'])){mark('frequency');pushFact('frequency',text)}
   if(has(t,['me gustaría','me gustaria','esperaría','esperaria','debería','deberia','necesito que','que lo comunique','la próxima','la proxima'])){mark('expectation');pushFact('expectation',text)}
   if(has(t,['desafío','desafio','reto','objetivo','como desafío','como desafio','podría','podria'])){mark('challenge');pushFact('challenge',text)}
   if(has(t,['estaría cumplido','estaria cumplido','sabremos','durante un mes','durante 4','%','criterio','sin riesgos','cada semana'])){mark('success');pushFact('success',text)}
   const sat=t.match(/satisfacci[oó]n[^0-9]{0,20}(10|[1-9])/); const rec=t.match(/recomendaci[oó]n[^0-9]{0,20}(10|[1-9])/);
   if(sat){state.session.metrics.sat=+sat[1];mark('satisfaction')} else if(has(t,['satisfacción','satisfaccion'])&&n.length){state.session.metrics.sat=n[0];mark('satisfaction')}
   if(rec){state.session.metrics.rec=+rec[1];mark('recommend')} else if(has(t,['recomendación','recomendacion','recomendar'])&&n.length){state.session.metrics.rec=n[n.length-1];mark('recommend')}
   if((state.session.metrics.sat||state.session.metrics.rec)&&has(t,['porque','por que','ya que','solo necesita','debido'])){mark('metricsWhy');pushFact('metricsWhy',text)}
  }
  function covPct(){const vals=Object.values(state.session.coverage);return Math.round(vals.reduce((a,v)=>a+(v==='complete'?1:v==='partial'?.5:0),0)/vals.length*100)}
  function nextQuestion(){const s=state.session,p=person(s.cfg.personId),name=p?p.name.split(' ')[0]:'la persona'; const c=s.coverage; const q=(reason,dim,arr)=>({reason,dim,question:arr[s.qAlt%arr.length]});
   if(!s.transcript.length)return q('Abrir la conversación de forma amplia','Contexto',[`¿Qué ha sido lo más relevante de ${name} en las últimas 3 semanas?`,`Si tuvieras que resumir el periodo reciente de ${name}, ¿qué destacarías primero?`]);
   if(c.strength==='missing')return q('Todavía no hay una fortaleza o reconocimiento sustentado','Fortalezas',[`¿Qué destacarías como logro o fortaleza de ${name} en este periodo?`,`¿Qué comportamiento de ${name} te gustaría que mantenga porque está aportando valor?`]);
   if(c.strength==='complete'&&c.positiveEvidence==='missing')return q('La fortaleza está expresada, pero falta evidencia concreta','Evidencia positiva',[`¿Qué situación reciente demuestra esa fortaleza y qué impacto positivo tuvo?`,`¿Puedes darme un ejemplo concreto de cuándo viste ese comportamiento?`]);
   if(c.om==='missing')return q('Aún no apareció una oportunidad de desarrollo','Oportunidad de Mejora',[`Si tuvieras que elegir una sola cosa que ${name} podría potenciar en las próximas semanas, ¿cuál sería?`,`¿Hay algo que hoy limite el impacto de ${name} y que valga la pena trabajar?`]);
   if(c.situation==='missing')return q('Hay una mejora mencionada, pero falta una situación concreta','Situación',[`¿Puedes contarme una situación específica en la que hayas observado eso?`,`¿Cuándo ocurrió por última vez? Cuéntame ese caso puntual.`]);
   if(c.behavior==='missing')return q('Falta separar percepción de comportamiento observable','Comportamiento',[`¿Qué hizo o dejó de hacer exactamente en esa situación?`,`¿Qué comportamiento concreto observaste, sin interpretarlo?`]);
   if(c.impact==='missing')return q('La situación y el comportamiento están claros; falta el impacto','Impacto',[`¿Qué impacto tuvo eso en el equipo, el cliente o el resultado?`,`¿Qué consecuencia concreta generó ese comportamiento?`]);
   if(c.frequency==='missing')return q('Necesitamos saber si es un caso aislado o un patrón','Frecuencia',[`¿Esto ocurrió una sola vez o lo has visto repetirse?`,`¿Con qué frecuencia dirías que ocurre?`]);
   if(c.expectation==='missing')return q('La brecha está clara, pero no la expectativa futura','Expectativa',[`¿Qué esperarías que hiciera diferente la próxima vez?`,`¿Cómo se vería el comportamiento esperado en la práctica?`]);
   if(c.challenge==='missing')return q('La oportunidad puede convertirse en feed-forward accionable','Desafío',[`¿Quieres plantear esa expectativa como un desafío concreto para ${name}?`,`¿Qué reto específico ayudaría a convertir esta mejora en una acción observable?`]);
   if(c.success==='missing')return q('Hay un desafío, pero todavía no es medible','Criterio de éxito',[`¿Qué significaría para ti que ese desafío se completó?`,`¿Qué evidencia te permitiría decir “esto ya mejoró”?`]);
   if(c.satisfaction==='missing')return q('Falta la señal cuantitativa de satisfacción','Satisfacción',[`Del 1 al 10, ¿qué tan satisfecho estás con el servicio de ${name}?`,`Si tuvieras que poner una nota de satisfacción del 1 al 10, ¿cuál sería?`]);
   if(c.recommend==='missing')return q('Falta la señal de recomendación','Recomendación',[`Del 1 al 10, ¿qué tan probable es que recomiendes a ${name} para un servicio similar?`,`¿Qué nota del 1 al 10 le darías en recomendación?`]);
   if(c.metricsWhy==='missing')return q('Tenemos la puntuación, pero no la explicación','Motivo de métricas',[`¿Por qué elegiste esas puntuaciones? ¿Qué tendría que pasar para subir un punto?`,`¿Qué explica principalmente esas notas?`]);
   return q('La cobertura mínima está completa','Cierre',[`Antes de cerrar, ¿hay algo importante sobre ${name} que no te haya preguntado?`,`Si ${name} leyera una sola idea de esta conversación, ¿cuál debería ser?`]);
  }
  function renderSession(){
   const s=state.session,p=person(s.cfg.personId),q=nextQuestion(),pct=covPct(),mins=Math.floor((Date.now()-s.started)/60000),timepct=Math.min(100,Math.round(mins/s.cfg.duration*100));
   $('#view').innerHTML=`<div class="session">
   <div class="card"><div class="toolbar"><div><h3 style="margin:0">Sesión sobre ${esc(p?.name)}</h3><span class="muted mini">${esc(s.cfg.client)} · ${esc(s.cfg.source)} (${esc(s.cfg.sourceRole)})</span></div><div class="spacer"></div><button class="btn sm" id="demo">▶ Demo</button></div>
   <div class="bar"><div style="width:${timepct}%"></div></div><div class="progressMeta"><span>${mins} / ${s.cfg.duration} min</span><span>${s.transcript.filter(x=>x.who==='client').length} intervenciones cliente</span></div>
   <div class="transcript" id="tb">${s.transcript.length?s.transcript.map(x=>`<div class="line ${x.who}"><span class="who">${x.who==='client'?esc(s.cfg.source):x.who==='fac'?esc(s.cfg.fac):'Coach IA'}</span><span class="txt">${esc(x.text)}</span></div>`).join(''):'<div class="empty">La transcripción aparecerá aquí. Usa la demo o ingresa intervenciones manualmente.</div>'}</div>
   <div class="toolbar" style="margin-top:10px"><select id="who" class="btn" style="font-weight:500"><option value="client">Cliente</option><option value="fac">Facilitador</option></select><input id="txt" style="flex:1;border:1px solid var(--line);border-radius:9px;padding:9px" placeholder="Simula una intervención de la reunión…"><button class="btn primary" id="add">Agregar</button></div>
   </div>
   <div class="grid" style="gap:12px">
    <div class="card"><div class="listen"><span class="dot"></span>Agente escuchando</div><div class="coverageHead" style="margin-top:14px"><b>Cobertura del feedback</b><strong>${pct}%</strong></div><div class="bar"><div style="width:${pct}%"></div></div><div class="dims">${DIMS.map(d=>`<span class="dim ${s.coverage[d[0]]}">${s.coverage[d[0]]==='complete'?'✓ ':s.coverage[d[0]]==='partial'?'◐ ':'○ '}${d[1]}</span>`).join('')}</div></div>
    <div class="coach"><div class="eyebrow">Siguiente mejor pregunta · ${esc(q.dim)}</div><div class="reason">${esc(q.reason)}</div><div class="question">“${esc(q.question)}”</div><div class="rowActions"><button class="btn agent sm" id="useQ">Usar pregunta</button><button class="btn sm" id="otherQ">Otra pregunta</button><button class="btn ghost sm" id="skipQ">Ignorar</button></div></div>
    <div class="card"><h3>Hallazgos detectados</h3><div class="detected">${detectedHTML(s)}</div></div>
    <div class="card"><h3>Métricas de sesión</h3>${metric('sat','Satisfacción',10)}${metric('rec','Recomendación',10)}<div class="notice" style="margin-top:8px">Las métricas adicionales por cliente pueden configurarse aparte (1–5 u otra escala).</div></div>
    <button class="btn agent" id="finish">⏹ Finalizar y estructurar feedback</button>
   </div></div>`;
   const tb=$('#tb');tb.scrollTop=tb.scrollHeight; $('#demo').onclick=loadDemo; $('#add').onclick=()=>{const v=$('#txt').value.trim();if(!v)return;addLine($('#who').value,v);renderSession()}; $('#txt').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#add').click()}};
   $('#useQ').onclick=()=>{addLine('fac',q.question);renderSession()}; $('#otherQ').onclick=()=>{s.qAlt++;renderSession()}; $('#skipQ').onclick=()=>{s.qAlt++;renderSession()};
   ['sat','rec'].forEach(k=>{const el=$('#m_'+k);el.oninput=e=>{s.metrics[k]=+e.target.value;$('#o_'+k).textContent=e.target.value;mark(k==='sat'?'satisfaction':'recommend');renderSession()}});
   $('#finish').onclick=finishSession;
  }
  function metric(k,l,max){const s=state.session,v=s.metrics[k]??Math.ceil(max*.8);return `<div class="metricRow"><span>${l}</span><input id="m_${k}" type="range" min="1" max="${max}" value="${v}"><output id="o_${k}">${s.metrics[k]??'—'}</output></div>`}
  function detectedHTML(s){const out=[];if(s.facts.strengths.length)out.push(det('⭐ Fortaleza',s.facts.strengths.at(-1)));if(s.facts.om.length)out.push(det('⚠ Posible OM',s.facts.om.at(-1)));if(s.facts.impact.length)out.push(det('↳ Impacto',s.facts.impact.at(-1)));if(s.facts.challenge.length)out.push(det('🎯 Posible desafío',s.facts.challenge.at(-1)));return out.join('')||'<div class="muted mini">Aún no hay hallazgos estructurados.</div>'}
  function det(t,p){return `<div class="det"><b>${t}</b><p>${esc(p)}</p></div>`}
  function finishSession(){const s=state.session,p=person(s.cfg.personId),pct=covPct(); if(pct<50&&!confirm(`La cobertura es ${pct}%. ¿Deseas finalizar de todas formas?`))return;
   const summary=buildSummary(s,p); s.result={summary};s.closed=true;renderLive();}
  function buildSummary(s,p){const last=a=>a.length?a.at(-1):'No confirmado en la conversación.';return {executive:`El cliente reconoce aportes relevantes de ${p.name.split(' ')[0]} y se identificó una oportunidad de desarrollo que debe ser validada antes de enviarse.`,strength:last(s.facts.strengths),positive:last(s.facts.positive.length?s.facts.positive:s.facts.impact),situation:last(s.facts.situation),behavior:last(s.facts.behavior),impact:last(s.facts.impact),frequency:last(s.facts.frequency),expectation:last(s.facts.expectation),challenge:last(s.facts.challenge),success:last(s.facts.success),metricsWhy:last(s.facts.metricsWhy),sat:s.metrics.sat,rec:s.metrics.rec}}
  function renderResult(){const s=state.session,r=s.result,p=person(s.cfg.personId);$('#view').innerHTML=`<div class="resultGrid"><div class="card"><div class="toolbar"><div><span class="pill">Borrador generado por IA</span><h3 style="font-size:21px;margin-top:10px">Feedback de ${esc(p.name)}</h3><span class="muted mini">Revisión humana obligatoria antes de enviar.</span></div></div>
   ${box('Resumen ejecutivo','executive',r.executive)}${box('Fortaleza / reconocimiento','strength',r.strength)}${box('Evidencia positiva','positive',r.positive)}
   <h3 style="margin-top:16px">Oportunidad de Mejora · SBI</h3><div class="grid g2">${box('Situación','situation',r.situation)}${box('Comportamiento','behavior',r.behavior)}${box('Impacto','impact',r.impact)}${box('Expectativa','expectation',r.expectation)}</div>
   <h3 style="margin-top:16px">Feed-forward</h3>${box('Desafío sugerido','challenge',r.challenge)}${box('Criterio de éxito','success',r.success)}
   <div class="summaryBox"><h4>Métricas</h4><p>Satisfacción: <b>${r.sat??'—'}/10</b> · Recomendación: <b>${r.rec??'—'}/10</b></p><p>${esc(r.metricsWhy)}</p></div>
   </div><div class="grid" style="align-content:start"><div class="card"><h3>Control de calidad</h3>${qualityRows(s)}<div class="notice" style="margin-top:10px">Hecho ≠ inferencia. El sistema solo debe enviar como afirmación lo que esté respaldado por la conversación.</div></div><div class="card"><h3>Acciones</h3><div class="rowActions"><button class="btn primary" id="saveDraft">Guardar borrador</button><button class="btn agent" id="approve">✓ Aprobar y generar seguimiento</button><button class="btn" id="backLive">Volver a sesión</button></div><p class="muted mini" style="margin-top:10px">“Aprobar” crea el Feedback, OM, Desafío y la reunión de Advisor dentro de esta POC local. No envía correo real.</p></div><div class="card"><h3>Vista previa de comunicación</h3><div class="summaryBox mini">Para: ${esc(p.email)}, ${esc(p.advisor)}<br><br><b>Asunto:</b> Resumen de feedback · ${esc(p.name)}<br><br>Hola ${esc(p.name.split(' ')[0])},<br><br>${esc(r.executive)}<br><br><b>Oportunidad principal:</b> ${esc(r.expectation)}<br><br><b>Desafío sugerido:</b> ${esc(r.challenge)}<br><br>Este contenido queda sujeto a revisión de tu Advisor.</div></div></div></div>`;
   $$('textarea[data-r]').forEach(t=>t.oninput=e=>r[e.target.dataset.r]=e.target.value); $('#saveDraft').onclick=()=>alert('Borrador guardado en la sesión local.'); $('#backLive').onclick=()=>{s.closed=false;renderLive()}; $('#approve').onclick=approveSession;}
  function box(title,key,val){return `<div class="summaryBox"><h4>${title}</h4><textarea data-r="${key}" style="width:100%;min-height:70px;border:0;background:transparent;resize:vertical;color:var(--text)">${esc(val)}</textarea></div>`}
  function qualityRows(s){const items=[['Evidencia concreta',s.coverage.situation==='complete'&&s.coverage.behavior==='complete'],['Impacto explícito',s.coverage.impact==='complete'],['OM estructurada',s.coverage.om==='complete'],['Criterio de éxito',s.coverage.success==='complete'],['Métricas + motivo',s.coverage.satisfaction==='complete'&&s.coverage.recommend==='complete'&&s.coverage.metricsWhy==='complete']];return items.map(x=>`<div class="reviewItem"><b>${x[1]?'✓':'○'} ${x[0]}</b><span class="badge ${x[1]?'ok':'warn'}" style="float:right">${x[1]?'Cubierto':'Revisar'}</span></div>`).join('')}
  function approveSession(){const s=state.session,r=s.result,p=person(s.cfg.personId),fid=id('f');db.feedback.push({id:fid,personId:p.id,date:days(0),client:s.cfg.client,source:s.cfg.source,sourceRole:s.cfg.sourceRole,status:'3-Reviewed',sat:r.sat,rec:r.rec,summary:r.executive,approved:true,transcript:s.transcript.slice()});
   let oid=null;if(s.coverage.om==='complete'){oid=id('o');db.oms.push({id:oid,personId:p.id,feedbackId:fid,keyword:(r.expectation||'Oportunidad de desarrollo').slice(0,55),competence:'Por clasificar',situation:r.situation,behavior:r.behavior,impact:r.impact,state:'0-Pendiente'})}
   if(s.coverage.challenge==='complete'){db.challenges.push({id:id('c'),personId:p.id,title:(r.challenge||'Desafío de desarrollo').slice(0,70),criteria:r.success,state:'Ideación',due:days(30),omId:oid,feedbackId:fid})}
   db.meetings.push({id:id('m'),personId:p.id,feedbackId:fid,advisor:p.advisor,date:days(3),done:false});db.audit.push({id:id('a'),at:new Date().toISOString(),action:'Feedback aprobado',feedbackId:fid});persist();s.approved=true;alert('Feedback aprobado. Se crearon el registro, la OM/desafío aplicables y el seguimiento con Advisor.');state.session=null;state.view='feedback';render();}
  function renderFeedback(){const rows=db.feedback.slice().reverse().map(f=>`<tr><td><b>${esc(person(f.personId)?.name)}</b></td><td>${esc(f.client)}</td><td>${esc(f.sourceRole||'—')}<div class="muted mini">${esc(f.source||'')}</div></td><td>${fmt(f.date)}</td><td>${f.sat??'—'}</td><td>${f.rec??'—'}</td><td><span class="badge ${f.approved?'ok':'warn'}">${f.status}</span></td></tr>`).join('');$('#view').innerHTML=`<div class="toolbar"><button class="btn agent" id="newLive">● Nuevo feedback en vivo</button><div class="spacer"></div><span class="pill">${db.feedback.length} registros</span></div><div class="tablewrap"><table><thead><tr><th>Talento</th><th>Cliente</th><th>Fuente</th><th>Fecha</th><th>Satisf.</th><th>Recom.</th><th>Estado</th></tr></thead><tbody>${rows||'<tr><td colspan=7>Sin registros</td></tr>'}</tbody></table></div>`;$('#newLive').onclick=()=>{state.view='live';render()}}
  function renderOM(){const rows=db.oms.map(o=>`<tr><td><b>${esc(person(o.personId)?.name)}</b></td><td>${esc(o.keyword)}</td><td>${esc(o.competence)}</td><td><b>S:</b> ${esc(o.situation)}<br><b>B:</b> ${esc(o.behavior)}<br><b>I:</b> ${esc(o.impact)}</td><td><span class="badge agentb">${esc(o.state)}</span></td></tr>`).join('');$('#view').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Talento</th><th>OM</th><th>Competencia</th><th>SBI</th><th>Maduración</th></tr></thead><tbody>${rows}</tbody></table></div>`}
  function renderChallenges(){const groups=['Ideación','Por hacer','En progreso','Hecho'];$('#view').innerHTML=`<div class="kanban">${groups.map(g=>`<div class="col"><h4>${g}</h4>${db.challenges.filter(c=>c.state===g).map(c=>`<div class="task"><strong>${esc(c.title)}</strong><p>${esc(person(c.personId)?.name)}</p><p>Éxito: ${esc(c.criteria)}</p><p>Vence: ${fmt(c.due)}</p></div>`).join('')||'<div class="muted mini">Sin desafíos</div>'}</div>`).join('')}</div>`}
  function renderFollow(){const rows=db.meetings.map(m=>`<tr><td><b>${esc(person(m.personId)?.name)}</b></td><td>${esc(m.advisor)}</td><td>${fmt(m.date)}</td><td><span class="badge ${m.done?'ok':'warn'}">${m.done?'Realizada':'Pendiente'}</span></td><td><button class="btn sm" data-done="${m.id}">${m.done?'Reabrir':'Marcar realizada'}</button></td></tr>`).join('');$('#view').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Colaborador</th><th>Advisor</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${rows||'<tr><td colspan=5>Sin seguimientos</td></tr>'}</tbody></table></div>`;$$('[data-done]').forEach(b=>b.onclick=()=>{const m=db.meetings.find(x=>x.id==b.dataset.done);m.done=!m.done;persist();renderFollow()})}
  function renderPeople(){const rows=db.people.map(p=>`<tr><td><b>${esc(p.name)}</b><div class="muted mini">${esc(p.email)}</div></td><td>${esc(p.client)}</td><td>${esc(p.unit)}</td><td>${esc(p.squad)}</td><td>${esc(p.advisor)}</td><td><span class="badge ok">${esc(p.status)}</span></td></tr>`).join('');$('#view').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Persona</th><th>Cliente</th><th>Unidad</th><th>Squad</th><th>Advisor</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div><div class="notice" style="margin-top:14px">En la solución productiva, Persona debe ser FK real para Feedback, OM y Desafíos; no se debe relacionar por texto.</div>`}
  function renderSettings(){$('#view').innerHTML=`<div class="grid g2"><div class="card"><h3>Parámetros del Coach</h3><div class="formgrid"><label class="field"><span>Duración objetivo</span><input id="cfgDur" type="number" value="${db.config.sessionMinutes}"></label><label class="field"><span>Cobertura objetivo (%)</span><input id="cfgCov" type="number" value="${db.config.coverageTarget}"></label><label class="field"><span>Escala satisfacción/recomendación</span><select id="cfgScale"><option ${db.config.metricScale===10?'selected':''}>10</option><option ${db.config.metricScale===5?'selected':''}>5</option></select></label><label class="field"><span>Canal de preguntas</span><select id="cfgMode"><option value="private">Panel privado</option><option value="chat">Chat de reunión</option></select></label></div><button class="btn primary" id="saveCfg" style="margin-top:14px">Guardar configuración</button></div><div class="card"><h3>Gobierno</h3><div class="reviewItem"><b>Revisión humana</b><div class="muted mini">Obligatoria antes del envío al Talento/Advisor.</div></div><div class="reviewItem"><b>Bloqueo tras Reviewed</b><div class="muted mini">En producción, el contenido original debe quedar auditado.</div></div><div class="reviewItem"><b>Datos corporativos</b><div class="muted mini">Teams / Azure / aXet / repositorio autorizado.</div></div><div class="reviewItem"><b>RBAC</b><div class="muted mini">Colaborador, Advisor, Líder, Admin.</div></div><button class="btn danger sm" id="reset">Reiniciar datos demo</button></div></div>`;$('#saveCfg').onclick=()=>{db.config.sessionMinutes=+$('#cfgDur').value;db.config.coverageTarget=+$('#cfgCov').value;db.config.metricScale=+$('#cfgScale').value;persist();alert('Configuración guardada')};$('#reset').onclick=()=>{if(confirm('¿Reiniciar todos los datos de la POC?')){db=seed();persist();state.session=null;render()}}}
  render();
  if (window.__teamsReady && typeof window.__teamsReady.then === 'function') {
    window.__teamsReady.then(function(ctx){
      try {
        const fc = ctx && ctx.page && ctx.page.frameContext;
        if (fc === 'meetingSidePanel' && !state.session) {
          state.view = 'live';
          if (options && options.frameContext === 'meetingSidePanel' && !state.session) { state.view = 'live'; }
  render();
        }
      } catch(e) { console.warn('Teams context adaptation failed', e); }
    });
  }
}

