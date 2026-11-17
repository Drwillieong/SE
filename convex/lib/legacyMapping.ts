export type LegacyStatus="pending_booking"|"approved"|"pending"|"rejected"|"cancelled"|"washing"|"drying"|"folding"|"ready"|"completed";
export function mapLegacyStatus(status:string,kilos:number|null|undefined):string{
  if(status==="pending_booking")return "requested";
  if(status==="pending")return kilos!==null&&kilos!==undefined?"received":"approved";
  return status;
}
export function mapLegacyServiceType(value:string):string{
  const known:Record<string,string>={fullService:"fullService",washDryFold:"washDryFold",washFold:"washFold",hangDry:"hangDry",dryCleaning:"dryCleaning"};
  return known[value]??value;
}
export function mapLegacyPickupSlot(value:string):"am"|"pm"|string{
  const normalized=value.toLowerCase().replaceAll(" ","");
  if(normalized.includes("7am")&&normalized.includes("10am"))return "am";
  if(normalized.includes("5pm")&&normalized.includes("7pm"))return "pm";
  return value;
}
export function pesosToCentavos(value:number|string|null|undefined):number{
  const pesos=typeof value==="string"?Number(value):value??0;
  if(!Number.isFinite(pesos))throw new Error("Legacy money value is invalid.");
  return Math.round(pesos*100);
}
