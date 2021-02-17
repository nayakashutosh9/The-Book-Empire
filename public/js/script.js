// import axios from 'axios';
// import Noty from 'noty'
let addToCart=document.querySelectorAll('.add-to-cart');
let cartCounter=document.querySelector('#cartCounter');

function updateCart(book){
    axios.post("/update-cart",book).then(res=>{
      cartCounter.innerText=res.data.totalQty;
    //   new Noty({
    //     text: 'Item added to cart'
    //   }).show();
  }).catch(err=>{
    console.log(err);
  })
}

addToCart.forEach(btn=>{
  btn.addEventListener('click',e=>{
    let book=JSON.parse(btn.dataset.book);
    updateCart(book);
  })
})
