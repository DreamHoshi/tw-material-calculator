'use strict';
const {recipes,materials}=TW_DATA, key='tw-material-calculator-holdings-v1';
const $=id=>document.getElementById(id), fmt=n=>n.toLocaleString('ja-JP');
let holdings=Object.create(null), active=null;
try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(!saved||typeof saved!=='object'||Array.isArray(saved))throw Error();for(const [n,v] of Object.entries(saved)){if(!Number.isSafeInteger(v)||v<0)throw Error();holdings[n]=v;}}catch{$('message').textContent='保存データを読み込めませんでした。所持数を入力し直してください。';holdings=Object.create(null);}
for(const name of Object.keys(recipes).sort()){const option=document.createElement('option');option.value=name;option.textContent=name;$('recipe').append(option);}
$('recipe').value=Object.keys(recipes)[0];
function render(){
  const result=calculateMaterials(recipes,active.name,active.amount,holdings), fragment=document.createDocumentFragment();let cost=0,unknown=0;
  const names=[...result.intermediate.keys()].sort().concat([...result.totals.keys()].sort());
  names.forEach((name,index)=>{
    const middle=result.intermediate.has(name), required=(middle?result.intermediate:result.totals).get(name), needed=Math.max(0,required-(result.used.get(name)||0)), data=materials[name]||{}, price=data.price||0;
    const subtotal=middle?0:needed*price;if(!Number.isSafeInteger(subtotal)||!Number.isSafeInteger(cost+subtotal))throw Error('費用が大きすぎます。');cost+=subtotal;if(!middle&&needed&&!price)unknown++;
    const row=document.createElement('tr');row.className=middle?'intermediate':result.related.has(name)?'related':(index-result.intermediate.size)%2?'gray':'';
    const values=[middle?name:'',middle?'':name,fmt(required),'',fmt(needed),middle?'—':price?fmt(price):'未設定',middle?'—':price?fmt(subtotal):'未計上',middle?'不足分を制作':data.source||''];
    values.forEach((value,col)=>{const cell=document.createElement('td');if(col===3){const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.max=String(Number.MAX_SAFE_INTEGER);input.required=true;input.value=holdings[name]||0;input.setAttribute('aria-label',name+'の所持数');input.addEventListener('change',()=>{const value=Number(input.value);if(!input.value.trim()||!Number.isSafeInteger(value)||value<0){input.setCustomValidity('0以上の整数を入力してください。');input.reportValidity();return;}input.setCustomValidity('');const old=holdings[name];holdings[name]=value;try{render();$('message').textContent='再計算しました。保存するには「所持数を保存」を押してください。';}catch(e){if(old===undefined)delete holdings[name];else holdings[name]=old;$('message').textContent=e.message;}});cell.append(input);}else cell.textContent=value;row.append(cell);});fragment.append(row);
  });
  $('rows').replaceChildren(fragment);$('cost').textContent=fmt(cost);$('fee').textContent=fmt(result.fee);$('unknown').textContent=unknown+'種類';
}
$('controls').addEventListener('submit',event=>{event.preventDefault();const previous=active;active={name:$('recipe').value,amount:Number($('amount').value)};try{render();$('message').textContent=active.name+' × '+fmt(active.amount);}catch(e){active=previous;$('message').textContent=e.message;}});
$('save').addEventListener('click',()=>{try{localStorage.setItem(key,JSON.stringify(holdings));$('message').textContent='このブラウザに所持数を保存しました。';}catch{$('message').textContent='保存できませんでした。ブラウザの保存設定をご確認ください。';}});
active={name:$('recipe').value,amount:1};render();
