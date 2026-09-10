"use client";

import {useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {QBMSIcon} from "@/components/layout/QBMSAppShell";
import {ORGANIZATION_QA_NODES} from "./qaModuleRegistry";
import styles from "./OrganizationQaWorkspace.module.css";

type View = "overview" | "business-units" | "level-grade" | "positions" | "reporting-lines" | "chart";
type BU = {id:string; name:string; code:string; description:string; status:"ACTIVE"|"INACTIVE"; order:number};
type Grade = {id:string; level:string; levelName:string; grade:number; title:string; experience:string; education:string};
type Family = {id:string; name:string; code:string; status:"ACTIVE"|"INACTIVE"};
type Position = {id:string; family:string; name:string; code:string; grades:string; status:"ACTIVE"|"INACTIVE"};
type Line = {id:string; employee:string; position:string; manager:string; managerPosition:string; type:"PRIMARY"|"DOTTED"};

const TABS: Array<{key:View; label:string; icon:"grid"|"building"|"badge"|"briefcase"|"network"|"users"}> = [
  {key:"overview",label:"Overview",icon:"grid"},
  {key:"business-units",label:"Business Unit",icon:"building"},
  {key:"level-grade",label:"Level / Grade",icon:"badge"},
  {key:"positions",label:"Position",icon:"briefcase"},
  {key:"reporting-lines",label:"Reporting Lines",icon:"network"},
  {key:"chart",label:"Organization Chart",icon:"users"},
];

const INITIAL_BU: BU[] = [
  {id:"bu1",name:"iQuri",code:"IQURI",description:"iQuri business unit",status:"ACTIVE",order:10},
  {id:"bu2",name:"QPOS",code:"QPOS",description:"QPOS business unit",status:"ACTIVE",order:20},
  {id:"bu3",name:"iQuri X",code:"IQURI_X",description:"iQuri X business unit",status:"ACTIVE",order:30},
  {id:"bu4",name:"LBB",code:"LBB",description:"LBB business unit",status:"ACTIVE",order:40},
];

const INITIAL_GRADES: Grade[] = [
  {id:"g1",level:"Level 0",levelName:"Top Management",grade:1,title:"President",experience:"N/A",education:"N/A"},
  {id:"g2",level:"Level 0",levelName:"Top Management",grade:2,title:"Vice President",experience:"N/A",education:"N/A"},
  {id:"g3",level:"Level I",levelName:"Executive Management (C-Level)",grade:3,title:"CEO",experience:"N/A",education:"N/A"},
  {id:"g4",level:"Level I",levelName:"Executive Management (C-Level)",grade:4,title:"C-Level",experience:"N/A",education:"N/A"},
  {id:"g5",level:"Level I",levelName:"Executive Management (C-Level)",grade:5,title:"Head of Department / Head of BU",experience:"12+ years (5+ management)",education:"Bachelor Degree"},
  {id:"g6",level:"Level II",levelName:"Senior Management",grade:6,title:"Senior Manager",experience:"Guidance",education:"Guidance"},
  {id:"g7",level:"Level II",levelName:"Senior Management",grade:7,title:"Mid Level Manager",experience:"Guidance",education:"Guidance"},
  {id:"g8",level:"Level III",levelName:"Junior Management",grade:8,title:"Junior Manager",experience:"Guidance",education:"Guidance"},
  {id:"g9",level:"Level III",levelName:"Junior Management",grade:9,title:"Team Leader / Supervisor / Assistant Secretary",experience:"Guidance",education:"Guidance"},
  {id:"g10",level:"Level IV",levelName:"Senior Contributor",grade:10,title:"Specialist / Expert",experience:"Guidance",education:"Guidance"},
  {id:"g11",level:"Level IV",levelName:"Senior Contributor",grade:11,title:"Senior Officer",experience:"Guidance",education:"Guidance"},
  {id:"g12",level:"Level V",levelName:"Entry Level",grade:12,title:"Mid Level Officer",experience:"Guidance",education:"Guidance"},
  {id:"g13",level:"Level V",levelName:"Entry Level",grade:13,title:"Junior Officer / Housekeeper",experience:"Guidance",education:"Guidance"},
  {id:"g14",level:"Level V",levelName:"Entry Level",grade:14,title:"Intern",experience:"Guidance",education:"Guidance"},
];

const INITIAL_FAMILIES: Family[] = [
  {id:"f1",name:"Sales",code:"SALES",status:"ACTIVE"},
  {id:"f2",name:"Product",code:"PRODUCT",status:"ACTIVE"},
  {id:"f3",name:"Human Resources",code:"HR",status:"ACTIVE"},
  {id:"f4",name:"Finance",code:"FINANCE",status:"ACTIVE"},
  {id:"f5",name:"Operations",code:"OPS",status:"ACTIVE"},
];

const INITIAL_POSITIONS: Position[] = [
  {id:"p1",family:"Sales",name:"Sales Manager",code:"SALES_MGR",grades:"G7–G8",status:"ACTIVE"},
  {id:"p2",family:"Sales",name:"Sales Executive",code:"SALES_EXEC",grades:"G12–G13",status:"ACTIVE"},
  {id:"p3",family:"Product",name:"Product Manager",code:"PRODUCT_MGR",grades:"G7–G8",status:"ACTIVE"},
  {id:"p4",family:"Product",name:"Product Officer",code:"PRODUCT_OFFICER",grades:"G11–G13",status:"ACTIVE"},
  {id:"p5",family:"Human Resources",name:"HR Manager",code:"HR_MGR",grades:"G7–G8",status:"ACTIVE"},
  {id:"p6",family:"Human Resources",name:"HR Officer",code:"HR_OFFICER",grades:"G11–G13",status:"ACTIVE"},
];

const INITIAL_LINES: Line[] = [
  {id:"r1",employee:"QA Mali S.",position:"Head of QPOS",manager:"QA David K.",managerPosition:"Chief Executive Officer",type:"PRIMARY"},
  {id:"r2",employee:"QA Niran P.",position:"Head of iQuri",manager:"QA David K.",managerPosition:"Chief Executive Officer",type:"PRIMARY"},
  {id:"r3",employee:"QA Somchai T.",position:"Sales Manager",manager:"QA Mali S.",managerPosition:"Head of QPOS",type:"PRIMARY"},
  {id:"r4",employee:"QA Kanya R.",position:"Product Manager",manager:"QA Mali S.",managerPosition:"Head of QPOS",type:"PRIMARY"},
  {id:"r5",employee:"QA Kanya R.",position:"Product Manager",manager:"QA Niran P.",managerPosition:"Head of iQuri",type:"DOTTED"},
  {id:"r6",employee:"QA Dao P.",position:"HR Officer",manager:"QA May L.",managerPosition:"HR Manager",type:"PRIMARY"},
];

function id(prefix:string){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;}

export default function OrganizationQaWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("view") as View | null;
  const view:View = TABS.some((x)=>x.key===requested) ? (requested as View) : "overview";

  const [businessUnits,setBusinessUnits] = useState(INITIAL_BU);
  const [grades,setGrades] = useState(INITIAL_GRADES);
  const [families,setFamilies] = useState(INITIAL_FAMILIES);
  const [positions,setPositions] = useState(INITIAL_POSITIONS);
  const [lines,setLines] = useState(INITIAL_LINES);
  const [edit,setEdit] = useState<{type:"bu"|"grade"|"family"|"position"|"line"; id?:string}|null>(null);

  const levels = useMemo(()=>{
    const map = new Map<string,Grade[]>();
    grades.forEach((g)=>{
      const key = `${g.level}|||${g.levelName}`;
      map.set(key,[...(map.get(key)||[]),g]);
    });
    return [...map.entries()].map(([key,rows])=>{const [level,levelName]=key.split("|||");return {level,levelName,rows};});
  },[grades]);

  const primary = lines.filter((x)=>x.type==="PRIMARY").length;
  const dotted = lines.filter((x)=>x.type==="DOTTED").length;

  return <div className={styles.wrap}>
    <div className={styles.safety}>
      <div><span>INTERACTIVE QA</span><strong>Organization QA Workspace</strong><p>Create / Edit / Delete below changes only browser-local QA sample data. Nothing is written to PostgreSQL or real Organization data.</p></div>
      <b>LOCAL SAMPLE ONLY</b>
    </div>

    <nav className={styles.tabs}>
      {TABS.map((tab)=><button key={tab.key} type="button" className={view===tab.key?styles.active:""} onClick={()=>router.replace(`/qa-data/organization?view=${tab.key}`)}><QBMSIcon name={tab.icon} size={16}/>{tab.label}</button>)}
    </nav>

    {view==="overview" && <div className={styles.overview}>
      {TABS.filter((x)=>x.key!=="overview").map((tab)=><button key={tab.key} onClick={()=>router.replace(`/qa-data/organization?view=${tab.key}`)}><QBMSIcon name={tab.icon} size={20}/><div><strong>{tab.label}</strong><small>{tab.key==="chart"?"Read-only auto-generated hierarchy":"Interactive QA preview with sample CRUD"}</small></div><QBMSIcon name="chevron" size={16}/></button>)}
    </div>}

    {view==="business-units" && <>
      <Header eyebrow="ORGANIZATION / MASTER DATA" title="Business Unit" body="QA version of Business Unit Master with local Create / Edit / Delete." action="Add Business Unit" onAction={()=>setEdit({type:"bu"})}/>
      <Metrics rows={[["Total Business Units",businessUnits.length,"QA master"],["Active",businessUnits.filter((x)=>x.status==="ACTIVE").length,"Selectable"],["Inactive",businessUnits.filter((x)=>x.status==="INACTIVE").length,"Not selectable"]]}/>
      <Table headers={["Business Unit","Code","Description","Status","Order","Actions"]}>
        {businessUnits.map((x)=><tr key={x.id}><td><strong>{x.name}</strong></td><td><code>{x.code}</code></td><td>{x.description}</td><td><span className={styles.status}>● {x.status}</span></td><td>{x.order}</td><td><Actions onEdit={()=>setEdit({type:"bu",id:x.id})} onDelete={()=>setBusinessUnits((r)=>r.filter((i)=>i.id!==x.id))}/></td></tr>)}
      </Table>
    </>}

    {view==="level-grade" && <>
      <Header eyebrow="ORGANIZATION / LEVEL & GRADE" title="Level / Grade" body="Experience and education remain guidance only. QA actions never change the real canonical Grade structure." action="Add Grade" onAction={()=>setEdit({type:"grade"})}/>
      <Metrics rows={[["Job Levels",levels.length,"Level 0 to Level V"],["Job Grades",grades.length,"QA sample"],["Criteria Guidance",grades.filter((x)=>x.experience!=="N/A").length,"Reference only"]]}/>
      <div className={styles.stack}>{levels.map((group)=><section className={styles.level} key={`${group.level}-${group.levelName}`}><header><div><span>{group.level}</span><strong>{group.levelName}</strong></div><b>● ACTIVE</b></header><Table headers={["Grade","Job Position Group","Experience","Education","Actions"]}>{group.rows.map((g)=><tr key={g.id}><td><i>{g.grade}</i></td><td><strong>{g.title}</strong></td><td>{g.experience}</td><td>{g.education}</td><td><Actions onEdit={()=>setEdit({type:"grade",id:g.id})} onDelete={()=>setGrades((r)=>r.filter((i)=>i.id!==g.id))}/></td></tr>)}</Table></section>)}</div>
    </>}

    {view==="positions" && <>
      <Header eyebrow="ORGANIZATION / POSITION" title="Position" body="One Position can cover multiple Grades. Business Unit is assigned with Employee Assignment." action="Add Position" onAction={()=>setEdit({type:"position"})}/>
      <Metrics rows={[["Job Families",families.length,"QA groups"],["Total Positions",positions.length,"QA job titles"],["Grade Mappings",positions.length,"Position ↔ Grade"]]}/>
      <div className={styles.two}>
        <Panel title="Job Family Master" subtitle="Career / function groups" add={()=>setEdit({type:"family"})}>{families.map((x)=><Row key={x.id} title={x.name} sub={x.code} onEdit={()=>setEdit({type:"family",id:x.id})} onDelete={()=>setFamilies((r)=>r.filter((i)=>i.id!==x.id))}/>)}</Panel>
        <Panel title="Position Master" subtitle="Job titles and Grade mapping" add={()=>setEdit({type:"position"})}>{positions.map((x)=><Row key={x.id} title={x.name} sub={`${x.family} · ${x.code} · ${x.grades}`} onEdit={()=>setEdit({type:"position",id:x.id})} onDelete={()=>setPositions((r)=>r.filter((i)=>i.id!==x.id))}/>)}</Panel>
      </div>
    </>}

    {view==="reporting-lines" && <>
      <Header eyebrow="ORGANIZATION / REPORTING LINES" title="Build the reporting structure" body="Primary and Dotted reporting are managed explicitly. Grade does not automatically decide reporting relationships." action="Add Reporting Line" onAction={()=>setEdit({type:"line"})}/>
      <Metrics rows={[["Active Assignments",ORGANIZATION_QA_NODES.length,"QA employees"],["Primary Lines",primary,"Solid"],["Dotted Lines",dotted,"Dotted"],["Without Primary",1,"Top-level"]]}/>
      <Table headers={["Employee","Position","Reports To","Manager Position","Type","Actions"]}>{lines.map((x)=><tr key={x.id}><td><strong>{x.employee}</strong></td><td>{x.position}</td><td><strong>{x.manager}</strong></td><td>{x.managerPosition}</td><td><span className={x.type==="PRIMARY"?styles.primary:styles.dotted}>{x.type}</span></td><td><Actions onEdit={()=>setEdit({type:"line",id:x.id})} onDelete={()=>setLines((r)=>r.filter((i)=>i.id!==x.id))}/></td></tr>)}</Table>
    </>}

    {view==="chart" && <>
      <Header eyebrow="ORGANIZATION / COMPANY VIEW" title="Organization Chart" body="Auto-generated from Employee Assignment and Reporting Lines. This page is intentionally read-only."/>
      <div className={styles.note}><QBMSIcon name="info" size={16}/>To change this chart, edit Employee Organization Assignment or Reporting Lines. The chart itself has no Create / Edit / Delete by design.</div>
      <Metrics rows={[["Employees",ORGANIZATION_QA_NODES.length,"QA sample"],["Primary Lines",13,"Generated"],["Dotted Lines",2,"Generated"],["Top-level",1,"CEO"]]}/>
      <div className={styles.chart}>{[0,1,2,3].map((lvl)=><div className={styles.chartLevel} key={lvl}>{ORGANIZATION_QA_NODES.filter((n)=>n.levelIndex===lvl).map((n)=><article key={n.id}><span className={styles.avatar}>{n.name.replace("QA ","").split(" ").map((p)=>p[0]).join("").slice(0,2)}</span><div><strong>{n.name}</strong><span>{n.position}</span><small>{n.businessUnit} · {n.grade} · {n.level}</small>{n.parentId?<em>Primary ↑ {ORGANIZATION_QA_NODES.find((x)=>x.id===n.parentId)?.name}</em>:<em>TOP LEVEL</em>}{n.dottedTo?<em className={styles.dottedText}>Dotted → {ORGANIZATION_QA_NODES.find((x)=>x.id===n.dottedTo)?.name}</em>:null}</div></article>)}</div>)}</div>
    </>}

    {edit && <Editor edit={edit} close={()=>setEdit(null)} businessUnits={businessUnits} setBusinessUnits={setBusinessUnits} grades={grades} setGrades={setGrades} families={families} setFamilies={setFamilies} positions={positions} setPositions={setPositions} lines={lines} setLines={setLines}/>}
  </div>;
}

function Header({eyebrow,title,body,action,onAction}:{eyebrow:string;title:string;body:string;action?:string;onAction?:()=>void}){
  return <section className={styles.header}><div><span>{eyebrow}</span><h3>{title}</h3><p>{body}</p></div>{action&&onAction?<button onClick={onAction}><QBMSIcon name="plus" size={16}/>{action}</button>:<div className={styles.readonly}>READ ONLY · AUTO GENERATED</div>}</section>;
}
function Metrics({rows}:{rows:Array<[string,number,string]>}){return <div className={styles.metrics}>{rows.map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</div>}
function Table({headers,children}:{headers:string[];children:React.ReactNode}){return <div className={styles.table}><table><thead><tr>{headers.map((h)=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
function Actions({onEdit,onDelete}:{onEdit:()=>void;onDelete:()=>void}){return <div className={styles.actions}><button onClick={onEdit}>Edit</button><button className={styles.delete} onClick={onDelete}>Delete</button></div>}
function Panel({title,subtitle,add,children}:{title:string;subtitle:string;add:()=>void;children:React.ReactNode}){return <section className={styles.panel}><header><div><strong>{title}</strong><small>{subtitle}</small></div><button onClick={add}>+ Add</button></header>{children}</section>}
function Row({title,sub,onEdit,onDelete}:{title:string;sub:string;onEdit:()=>void;onDelete:()=>void}){return <div className={styles.row}><div><strong>{title}</strong><small>{sub}</small></div><Actions onEdit={onEdit} onDelete={onDelete}/></div>}

function Editor(props:{
  edit:{type:"bu"|"grade"|"family"|"position"|"line";id?:string};
  close:()=>void;
  businessUnits:BU[]; setBusinessUnits:React.Dispatch<React.SetStateAction<BU[]>>;
  grades:Grade[]; setGrades:React.Dispatch<React.SetStateAction<Grade[]>>;
  families:Family[]; setFamilies:React.Dispatch<React.SetStateAction<Family[]>>;
  positions:Position[]; setPositions:React.Dispatch<React.SetStateAction<Position[]>>;
  lines:Line[]; setLines:React.Dispatch<React.SetStateAction<Line[]>>;
}){
  const {edit,close}=props;
  const title = edit.type==="bu"?"Business Unit":edit.type==="grade"?"Grade":edit.type==="family"?"Job Family":edit.type==="position"?"Position":"Reporting Line";

  let fields:React.ReactNode;
  let submit:(fd:FormData)=>void;

  if(edit.type==="bu"){
    const cur=props.businessUnits.find((x)=>x.id===edit.id);
    fields=<><label>Name<input name="name" defaultValue={cur?.name||""} required/></label><label>Code<input name="code" defaultValue={cur?.code||""} required/></label><label>Description<input name="description" defaultValue={cur?.description||""}/></label><label>Status<select name="status" defaultValue={cur?.status||"ACTIVE"}><option>ACTIVE</option><option>INACTIVE</option></select></label><label>Order<input name="order" type="number" defaultValue={cur?.order||50}/></label></>;
    submit=(fd)=>{const n:BU={id:cur?.id||id("bu"),name:String(fd.get("name")),code:String(fd.get("code")).toUpperCase(),description:String(fd.get("description")||""),status:String(fd.get("status")) as BU["status"],order:Number(fd.get("order")||50)};props.setBusinessUnits((r)=>cur?r.map((x)=>x.id===cur.id?n:x):[...r,n]);};
  }else if(edit.type==="grade"){
    const cur=props.grades.find((x)=>x.id===edit.id);
    fields=<><label>Level<input name="level" defaultValue={cur?.level||"Level V"} required/></label><label>Level Name<input name="levelName" defaultValue={cur?.levelName||"Entry Level"} required/></label><label>Grade<input name="grade" type="number" defaultValue={cur?.grade||15} required/></label><label>Job Position Group<input name="title" defaultValue={cur?.title||""} required/></label><label>Experience Guidance<input name="experience" defaultValue={cur?.experience||"Guidance"}/></label><label>Education Guidance<input name="education" defaultValue={cur?.education||"Guidance"}/></label></>;
    submit=(fd)=>{const n:Grade={id:cur?.id||id("g"),level:String(fd.get("level")),levelName:String(fd.get("levelName")),grade:Number(fd.get("grade")),title:String(fd.get("title")),experience:String(fd.get("experience")||"Guidance"),education:String(fd.get("education")||"Guidance")};props.setGrades((r)=>cur?r.map((x)=>x.id===cur.id?n:x):[...r,n]);};
  }else if(edit.type==="family"){
    const cur=props.families.find((x)=>x.id===edit.id);
    fields=<><label>Name<input name="name" defaultValue={cur?.name||""} required/></label><label>Code<input name="code" defaultValue={cur?.code||""} required/></label><label>Status<select name="status" defaultValue={cur?.status||"ACTIVE"}><option>ACTIVE</option><option>INACTIVE</option></select></label></>;
    submit=(fd)=>{const n:Family={id:cur?.id||id("f"),name:String(fd.get("name")),code:String(fd.get("code")).toUpperCase(),status:String(fd.get("status")) as Family["status"]};props.setFamilies((r)=>cur?r.map((x)=>x.id===cur.id?n:x):[...r,n]);};
  }else if(edit.type==="position"){
    const cur=props.positions.find((x)=>x.id===edit.id);
    fields=<><label>Job Family<select name="family" defaultValue={cur?.family||props.families[0]?.name}>{props.families.map((x)=><option key={x.id}>{x.name}</option>)}</select></label><label>Position Name<input name="name" defaultValue={cur?.name||""} required/></label><label>Code<input name="code" defaultValue={cur?.code||""} required/></label><label>Allowed Grades<input name="grades" defaultValue={cur?.grades||"G12–G13"} required/></label><label>Status<select name="status" defaultValue={cur?.status||"ACTIVE"}><option>ACTIVE</option><option>INACTIVE</option></select></label></>;
    submit=(fd)=>{const n:Position={id:cur?.id||id("p"),family:String(fd.get("family")),name:String(fd.get("name")),code:String(fd.get("code")).toUpperCase(),grades:String(fd.get("grades")),status:String(fd.get("status")) as Position["status"]};props.setPositions((r)=>cur?r.map((x)=>x.id===cur.id?n:x):[...r,n]);};
  }else{
    const cur=props.lines.find((x)=>x.id===edit.id);
    fields=<><label>Employee<input name="employee" defaultValue={cur?.employee||""} required/></label><label>Employee Position<input name="position" defaultValue={cur?.position||""} required/></label><label>Reports To<input name="manager" defaultValue={cur?.manager||""} required/></label><label>Manager Position<input name="managerPosition" defaultValue={cur?.managerPosition||""} required/></label><label>Reporting Type<select name="type" defaultValue={cur?.type||"PRIMARY"}><option>PRIMARY</option><option>DOTTED</option></select></label></>;
    submit=(fd)=>{const n:Line={id:cur?.id||id("r"),employee:String(fd.get("employee")),position:String(fd.get("position")),manager:String(fd.get("manager")),managerPosition:String(fd.get("managerPosition")),type:String(fd.get("type")) as Line["type"]};props.setLines((r)=>cur?r.map((x)=>x.id===cur.id?n:x):[...r,n]);};
  }

  return <div className={styles.modalBack} onMouseDown={close}><div className={styles.modal} onMouseDown={(e)=>e.stopPropagation()}><header><div><span>QA SAMPLE EDITOR</span><h4>{edit.id?"Edit":"Create"} {title}</h4><p>Save changes only this browser-local QA sample.</p></div><button onClick={close}>×</button></header><form onSubmit={(e)=>{e.preventDefault();submit(new FormData(e.currentTarget));close();}}>{fields}<footer><button type="button" onClick={close}>Cancel</button><button type="submit">Save QA Sample</button></footer></form></div></div>;
}
