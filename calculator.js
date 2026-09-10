(function(root){
  function calculate(recipes, item, amount, holdings={}) {
    if(!Object.hasOwn(recipes,item)) throw new Error('レシピを選択してください。');
    if(!Number.isSafeInteger(amount)||amount<1||amount>1e9) throw new Error('制作個数は1～1,000,000,000の整数で入力してください。');
    const totals=new Map(), intermediate=new Map(), used=new Map(), related=new Set(), stock=new Map();
    for(const [name,value] of Object.entries(holdings)){
      if(!Number.isSafeInteger(value)||value<0) throw new Error('所持数は0以上の整数で入力してください。');
      stock.set(name,value);
    }
    let fee=0;
    function visit(name,count,stack=[]){
      if(!Number.isSafeInteger(count)) throw new Error('計算結果が大きすぎます。制作個数を減らしてください。');
      if(stack.includes(name)) throw new Error('レシピが循環しています: '+name);
      const recipe=Object.hasOwn(recipes,name)?recipes[name]:null;
      if(!recipe&&stack.length>1) related.add(name);
      if(stack.length){
        const target=recipe?intermediate:totals;
        const total=(target.get(name)||0)+count;
        if(!Number.isSafeInteger(total)) throw new Error('計算結果が大きすぎます。');
        target.set(name,total);
        const consumed=Math.min(count,stock.get(name)||0);
        stock.set(name,(stock.get(name)||0)-consumed); used.set(name,(used.get(name)||0)+consumed);count-=consumed;
      }
      if(recipe){fee+=count*(recipe.fee||0);if(!Number.isSafeInteger(fee)) throw new Error('費用が大きすぎます。');
        for(const [child,qty] of Object.entries(recipe.ingredients)) visit(child,count*qty,[...stack,name]);}
    }
    visit(item,amount);
    return {totals,intermediate,used,related,fee};
  }
  root.calculateMaterials=calculate;
  if(typeof module!=='undefined') module.exports=calculate;
})(globalThis);
