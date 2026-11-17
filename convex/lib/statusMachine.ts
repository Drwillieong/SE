export type OrderStatus = "requested"|"approved"|"picked_up"|"received"|"washing"|"drying"|"folding"|"ready"|"out_for_delivery"|"completed"|"rejected"|"cancelled";
export type ServiceOption = "pickupOnly"|"pickupAndDelivery";
export const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  requested:["approved","rejected","cancelled"],approved:["picked_up","cancelled"],picked_up:["received","cancelled"],received:["washing","cancelled"],washing:["drying"],drying:["folding"],folding:["ready"],ready:["out_for_delivery","completed"],out_for_delivery:["completed"],completed:[],rejected:[],cancelled:[],
};
export function canTransition(from:OrderStatus,to:OrderStatus,serviceOption:ServiceOption):boolean{
  if(!allowedTransitions[from].includes(to))return false;
  return !(from==="ready"&&to==="out_for_delivery"&&serviceOption==="pickupOnly")&&!(from==="ready"&&to==="completed"&&serviceOption==="pickupAndDelivery");
}
export function nextStage(status:OrderStatus,serviceOption:ServiceOption):OrderStatus|undefined{
  const target:Partial<Record<OrderStatus,OrderStatus>>={received:"washing",washing:"drying",drying:"folding",folding:"ready",ready:serviceOption==="pickupOnly"?"completed":"out_for_delivery",out_for_delivery:"completed"};
  return target[status];
}
