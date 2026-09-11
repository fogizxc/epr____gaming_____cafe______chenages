const PROP_URL='EPR_TOURNAMENT_SYNC_URL';
const PROP_SECRET='EPR_TOURNAMENT_SYNC_SECRET';
const SHEET_NAME='Form Responses 1';

function syncLatestTournamentResponse(e){
  const p=PropertiesService.getScriptProperties();
  const url=(p.getProperty(PROP_URL)||'').trim();
  const secret=(p.getProperty(PROP_SECRET)||'').trim();
  if(!url||!secret) throw new Error('Set EPR_TOURNAMENT_SYNC_URL and EPR_TOURNAMENT_SYNC_SECRET in Script Properties.');
  const values=e&&e.namedValues?e.namedValues:{};
  const get=(name)=>Array.isArray(values[name])?values[name][0]:values[name]||'';
  const members=[];
  for(let i=1;i<=10;i++){
    const name=get('Member '+i+' Name');
    const email=get('Member '+i+' Email');
    const phone=get('Member '+i+' Phone');
    const gamerTag=get('Member '+i+' Gamer Tag');
    if(name||email) members.push({name,email,phone,gamerTag});
  }
  const payload={
    teamId:get('Team ID')||get('Registration ID'),
    tournamentId:get('Tournament ID'),
    responseId:get('Response ID')||get('Timestamp'),
    timestamp:get('Timestamp'),
    members,
    submittedAt:get('Timestamp')
  };
  const response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{'X-Google-Forms-Secret':secret},payload:JSON.stringify(payload),muteHttpExceptions:true});
  const code=response.getResponseCode();
  if(code<200||code>=300) throw new Error('EPR sync failed ('+code+'): '+response.getContentText());
}

function installTournamentTrigger(){
  const ss=SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncLatestTournamentResponse').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncLatestTournamentResponse').forSpreadsheet(ss).onFormSubmit().create();
}

function setTournamentSyncProperties(){
  // Run once after replacing the placeholders with your production values.
  PropertiesService.getScriptProperties().setProperties({
    EPR_TOURNAMENT_SYNC_URL:'https://YOUR-EPR-DOMAIN/api/integrations/google-forms/tournament-response',
    EPR_TOURNAMENT_SYNC_SECRET:'REPLACE_WITH_THE_SAME_RANDOM_SECRET_AS_SERVER'
  });
}
