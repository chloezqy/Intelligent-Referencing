import React,{useState} from 'react';
import {useStudy} from '../useStudy';
import {STUDY_TASK_COUNT,studyTask,studySelectionProgress} from '../study';
export default function StudyPanel({study:s}:{study:ReturnType<typeof useStudy>}){
 const [participant,setParticipant]=useState('');
 const ready=!!s.session&&/^P\d+$/i.test(s.session.participant);
 const task=studyTask(s.attempt),progress=studySelectionProgress(s.attempt);
 const done=!!s.session?.endedAt&&['complete','skipped'].includes(s.attempt?.outcome||'')&&s.attempt.task===STUDY_TASK_COUNT-1;
 return <div className="collab-panel study-panel" data-study-control="true">
 {!s.active?<section><h3>User study</h3><p>Turn on User study mode to begin.</p>{s.sessions.length>0&&<button onClick={s.exportLog}>Download study records</button>}</section>:!ready?<section>
 <h3>Ready to begin?</h3><form onSubmit={e=>{e.preventDefault();if(/^P\d+$/i.test(participant.trim()))s.identify(participant);}}>
 <label>Participant ID<input autoFocus aria-label="Participant ID" placeholder="P1" pattern="[Pp][0-9]+" required value={participant} onChange={e=>setParticipant(e.target.value)} maxLength={20}/></label>
 <button className="primary-action" type="submit">Start study</button></form>
 </section>:done?<section aria-live="polite"><h3>Study finished</h3><p>Thank you! Your task times and interactions have been saved.</p><button onClick={s.exportLog}>Download study records</button></section>:<section aria-live="polite">
 <p className="subtle">{s.session.participant} · Task {task.group} of 4{task.level?` · Selection level ${task.level} of 3`:null}</p>
 <h3>{task.title}</h3><p>{task.prompt}</p>
 <p className="subtle">{progress?`${progress.selected}/${progress.total} target objects selected${progress.extra?` · ${progress.extra} extra`:""}. `:""}The next task will appear automatically when you finish.</p>
 <button type="button" disabled={!s.attempt||!!s.attempt.endedAt} onClick={s.skip}>{task.level?'Skip this level':'Skip task'}</button>
 </section>}
 {s.error&&<p role="alert">{s.error}</p>}
 </div>;
}
