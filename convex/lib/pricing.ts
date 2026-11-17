export type PricingService={_id:string;name:string;pricingType:"per_load"|"per_kilo"|"flat"|"quote";price:number;startingPrice?:number};
export type QuoteSelection={serviceId:string;quantity:number};
export type QuoteZone={isFreeZone:boolean;freeMinLoads:number;fee:number}|null;
export type QuoteLine={serviceId:string;name:string;pricingType:PricingService["pricingType"];unitPrice:number;quantity:number;subtotal:number;startingPrice?:number};
export function computeQuote(input:{services:PricingService[];selections:QuoteSelection[];loads:number;serviceOption:"pickupOnly"|"pickupAndDelivery";zone:QuoteZone;kilos?:number}){
  let hasPendingQuote=false;
  const lines:QuoteLine[]=input.selections.map(selection=>{
    const service=input.services.find(item=>item._id===selection.serviceId);
    if(!service)throw new Error("A selected service is unavailable.");
    const quantity=service.pricingType==="per_load"?input.loads:selection.quantity;
    const unitPrice=service.pricingType==="quote"?0:service.price;
    if(service.pricingType==="quote")hasPendingQuote=true;
    if(service.pricingType==="per_kilo"&&!input.kilos)hasPendingQuote=true;
    const pricedQuantity=service.pricingType==="per_kilo"?(input.kilos??0):quantity;
    return {serviceId:service._id,name:service.name,pricingType:service.pricingType,unitPrice,quantity:pricedQuantity,subtotal:unitPrice*pricedQuantity,...(service.pricingType==="quote"&&service.startingPrice!==undefined?{startingPrice:service.startingPrice}:{})};
  });
  const subtotal=lines.reduce((sum,line)=>sum+line.subtotal,0);
  const deliveryFee=input.serviceOption==="pickupOnly"?0:input.zone?.isFreeZone&&input.loads>=input.zone.freeMinLoads?0:input.zone?.fee??0;
  return {lines,subtotal,deliveryFee,discount:0,total:subtotal+deliveryFee,hasPendingQuote};
}
