const zone="Asia/Manila";
export function todayManila(now=new Date()):string{return new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);}
export function isPastDate(date:string, today=todayManila()):boolean{return date<today;}
export function addDays(date:string,days:number):string{const value=new Date(`${date}T00:00:00.000Z`);value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);}
export function formatDate(date:string):string{return new Intl.DateTimeFormat("en-PH",{timeZone:zone,dateStyle:"medium"}).format(new Date(`${date}T00:00:00.000Z`));}
