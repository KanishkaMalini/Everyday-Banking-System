import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard, LayoutDashboard, ReceiptText, UserRound, LogOut, Plus, Search, Bell, ShieldCheck, Wallet, Menu, X, Eye, EyeOff, Download, Trash2, CheckCircle2 } from 'lucide-react';

const STORE = 'everyday_bank_accounts_v1';
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
const readAccounts = () => { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } };
const saveAccounts = a => localStorage.setItem(STORE, JSON.stringify(a));

function Brand(){return <div className="brand-mark"><span className="brand-symbol">e</span><span>everyday<span className="brand-light"> banking</span></span></div>}

export default function App(){
  const [accounts,setAccounts] = useState(readAccounts);
  const [current,setCurrent] = useState(null);
  const [screen,setScreen] = useState('dashboard');
  const [authMode,setAuthMode] = useState('login');
  const [auth,setAuth] = useState({name:'',email:'',phone:'',account:'',password:''});
  const [otp,setOtp] = useState('');
  const [pending,setPending] = useState(null);
  const [notice,setNotice] = useState('');
  const [mobileNav,setMobileNav] = useState(false);
  const [search,setSearch] = useState('');
  const [showBalance,setShowBalance] = useState(true);
  const [form,setForm] = useState({amount:'',to:'',type:'Electricity',billNumber:''});

  useEffect(()=>saveAccounts(accounts),[accounts]);
  const active = accounts.find(a=>a.email===current) || null;
  const transactions = active?.transactions || [];
  const filtered = useMemo(()=>transactions.filter(t=>(t.note+' '+t.type+' '+t.date).toLowerCase().includes(search.toLowerCase())),[transactions,search]);

  function updateAccount(email,fn){setAccounts(prev=>prev.map(a=>a.email===email?fn({...a}):a));}
  function addTransaction(email,tx,change){updateAccount(email,a=>({...a,balance:Math.round((a.balance+change)*100)/100,transactions:[tx,...a.transactions]}));}
  function makeTx(type,amount,note){return {id:Date.now()+Math.random(),type,amount:Number(amount),note,date:new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})};}
  function submitAuth(e){
    e.preventDefault();
    const email=auth.email.trim().toLowerCase();
    if(authMode==='signup'){
      if(accounts.some(a=>a.email===email)){setNotice('An account with this email already exists.');return;}
      if(auth.password.length<4){setNotice('Choose a password with at least 4 characters.');return;}
      const account={name:auth.name.trim(),email,phone:auth.phone,accountNo:String(Math.floor(100000000000+Math.random()*899999999999)),password:auth.password,balance:25000,transactions:[]};
      setPending({email,mode:'signup',account});
    }else{
      const found=accounts.find(a=>a.email===email && a.password===auth.password);
      if(!found){setNotice('The email or password is incorrect.');return;}
      setPending({email,mode:'login'});
    }
    setOtp('');setNotice('');
  }
  function verifyOtp(e){
    e.preventDefault();
    if(otp.trim()!=='123456'){setNotice('That verification code is not correct. Try 123456 for this project demo.');return;}
    if(pending.mode==='signup')setAccounts(prev=>[...prev,pending.account]);
    setCurrent(pending.email);setPending(null);setScreen('dashboard');setNotice('');
  }
  function logout(){setCurrent(null);setPending(null);setAuth({name:'',email:'',phone:'',account:'',password:''});setScreen('dashboard');}
  function action(kind){
    const amount=Number(form.amount);
    if(!Number.isFinite(amount)||amount<=0){setNotice('Enter an amount greater than zero.');return;}
    if(kind==='withdraw' && amount>active.balance){setNotice('There is not enough balance for this withdrawal.');return;}
    if(kind==='transfer'){
      const recipient=form.to.trim().toLowerCase();
      const target=accounts.find(a=>a.email===recipient);
      if(!target||recipient===active.email){setNotice('Enter the email address of another registered user.');return;}
      if(amount>active.balance){setNotice('There is not enough balance for this transfer.');return;}
      addTransaction(active.email,makeTx('Transfer sent',amount,`To ${recipient}`),-amount);
      updateAccount(recipient,a=>({...a,balance:a.balance+amount,transactions:[makeTx('Transfer received',amount,`From ${active.email}`),...a.transactions]}));
    }else if(kind==='deposit')addTransaction(active.email,makeTx('Deposit',amount,'Cash deposit'),amount);
    else if(kind==='withdraw')addTransaction(active.email,makeTx('Withdrawal',amount,'Cash withdrawal'),-amount);
    else addTransaction(active.email,makeTx('Bill payment',amount,`${form.type} · ${form.billNumber||'Payment'}`),-amount);
    setForm({amount:'',to:'',type:'Electricity',billNumber:''});setNotice('Transaction completed successfully.');setScreen('transactions');
  }
  function exportCsv(){
    const rows=[['Date','Type','Description','Amount'],...transactions.map(t=>[t.date,t.type,t.note,t.amount])];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='account-statement.csv';a.click();URL.revokeObjectURL(url);
  }
  const nav=[['dashboard','Overview',LayoutDashboard],['deposit','Deposit',ArrowDownLeft],['withdraw','Withdraw',ArrowUpRight],['transfer','Transfer',ArrowLeftRight],['bills','Pay bills',ReceiptText],['transactions','Transactions',CreditCard],['profile','My profile',UserRound]];
  if(!active){
    return <main className="auth-page"><div className="auth-shell"><div className="auth-intro"><Brand/><div className="intro-copy"><p className="eyebrow">BANKING, MADE CLEAR</p><h1>Your money.<br/>Your everyday.</h1><p>Keep track of your balance, move money and manage everyday payments in one place.</p><div className="intro-note"><ShieldCheck size={18}/> A simple banking project demonstration</div></div><div className="auth-footer">A straightforward way to manage your account.</div></div>
    <section className="auth-panel">
      {!pending ? <><div className="mobile-brand"><Brand/></div><div className="auth-heading"><p className="eyebrow">{authMode==='login'?'WELCOME BACK':'GET STARTED'}</p><h2>{authMode==='login'?'Sign in to your account':'Open an account'}</h2><p>{authMode==='login'?'Enter your details to continue.':'Fill in your details to create an account.'}</p></div>
      <form className="auth-form" onSubmit={submitAuth}>
        {authMode==='signup'&&<label>Full name<input required value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input required type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="name@example.com"/></label>
        {authMode==='signup'&&<label>Mobile number<input required value={auth.phone} onChange={e=>setAuth({...auth,phone:e.target.value})} placeholder="Mobile number"/></label>}
        <label>Password<input required type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="Enter your password"/></label>
        <button className="primary full" type="submit">{authMode==='login'?'Continue':'Create account'}</button>
      </form>
      <p className="switch-auth">{authMode==='login'?"Don't have an account?":"Already have an account?"} <button onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setNotice('')}}>{authMode==='login'?'Create one':'Sign in'}</button></p>
      {notice&&<p className="notice">{notice}</p>}
      </>:<><button className="back-link" onClick={()=>setPending(null)}>← Back</button><div className="auth-heading otp-heading"><div className="otp-icon"><ShieldCheck/></div><p className="eyebrow">ACCOUNT VERIFICATION</p><h2>Enter your code</h2><p>Enter the six-digit verification code to finish signing in.</p></div><form className="auth-form" onSubmit={verifyOtp}><label>Verification code<input className="otp-input" inputMode="numeric" maxLength="6" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="000000" required/></label><p className="demo-hint">Project demo code: <strong>123456</strong></p><button className="primary full" type="submit">Verify and continue</button></form>{notice&&<p className="notice">{notice}</p>}</>}
    </section></div></main>
  }
  const title=nav.find(n=>n[0]===screen)?.[1]||'Overview';
  return <div className="app-layout">
    <aside className={`sidebar ${mobileNav?'sidebar-open':''}`}><div className="side-top"><Brand/><button className="close-nav" onClick={()=>setMobileNav(false)}><X/></button></div><div className="side-account"><div className="avatar">{active.name.slice(0,1).toUpperCase()}</div><div><strong>{active.name}</strong><span>Personal account</span></div></div><p className="nav-caption">MENU</p><nav>{nav.map(([id,label,Icon])=><button key={id} className={`nav-item ${screen===id?'selected':''}`} onClick={()=>{setScreen(id);setNotice('');setMobileNav(false)}}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="side-bottom"><div className="help-card"><ShieldCheck size={18}/><strong>Account security</strong><span>Keep your sign-in details private.</span></div><button className="nav-item logout" onClick={logout}><LogOut size={18}/>Sign out</button></div></aside>
    {mobileNav&&<button className="nav-backdrop" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area"><header className="topbar"><button className="menu-button" onClick={()=>setMobileNav(true)}><Menu/></button><div className="crumb">My account <span>/</span> <strong>{title}</strong></div><div className="top-actions"><span className="today-label">{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span><button className="icon-button" title="Notifications"><Bell size={18}/></button><div className="top-avatar">{active.name.slice(0,1).toUpperCase()}</div></div></header>
    <div className="content"><div className="page-heading"><div><p className="eyebrow">PERSONAL BANKING</p><h1>{screen==='dashboard'?`Good day, ${active.name.split(' ')[0]}`:title}</h1><p>{screen==='dashboard'?'Here is a quick look at your account.':`Manage your ${title.toLowerCase()} details here.`}</p></div></div>
      {notice&&<div className="notice-bar"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')}>×</button></div>}
      {screen==='dashboard'&&<><section className="balance-card"><div className="balance-top"><span>AVAILABLE BALANCE</span><button onClick={()=>setShowBalance(!showBalance)}>{showBalance?<Eye size={17}/>:<EyeOff size={17}/>} {showBalance?'Hide':'Show'}</button></div><div className="balance-amount">{showBalance?money(active.balance):'••••••••'}</div><div className="account-meta"><span>Account number</span><strong>•••• •••• {active.accountNo.slice(-4)}</strong><span className="account-type">Savings account</span></div></section><div className="quick-actions"><button onClick={()=>setScreen('deposit')}><span className="quick-icon green"><ArrowDownLeft/></span><span><strong>Deposit</strong><small>Add money</small></span></button><button onClick={()=>setScreen('transfer')}><span className="quick-icon blue"><ArrowLeftRight/></span><span><strong>Transfer</strong><small>Send money</small></span></button><button onClick={()=>setScreen('bills')}><span className="quick-icon peach"><ReceiptText/></span><span><strong>Pay bills</strong><small>Pay utilities</small></span></button><button onClick={()=>setScreen('transactions')}><span className="quick-icon lilac"><CreditCard/></span><span><strong>Activity</strong><small>View history</small></span></button></div><section className="panel"><div className="panel-head"><div><h3>Recent activity</h3><p>Your latest account transactions</p></div><button className="text-button" onClick={()=>setScreen('transactions')}>View all</button></div><TransactionList items={transactions.slice(0,5)}/></section></>}
      {['deposit','withdraw','transfer','bills'].includes(screen)&&<section className="panel form-panel"><div className="panel-head"><div><h3>{screen==='bills'?'Bill payment':title}</h3><p>{screen==='deposit'?'Add funds to your account.':screen==='withdraw'?'Withdraw funds from your account.':screen==='transfer'?'Send money to another registered account.':'Pay a household or utility bill.'}</p></div><div className="form-icon"><Wallet/></div></div><div className="form-grid">
        {screen==='bills'&&<label>Bill category<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Electricity</option><option>Water</option><option>Mobile recharge</option><option>Internet</option><option>Gas</option></select></label>}
        {screen==='transfer'&&<label className="wide">Recipient email<input type="email" value={form.to} onChange={e=>setForm({...form,to:e.target.value})} placeholder="recipient@example.com"/></label>}
        {screen==='bills'&&<label className="wide">Consumer / reference number<input value={form.billNumber} onChange={e=>setForm({...form,billNumber:e.target.value})} placeholder="Enter reference number"/></label>}
        <label className="wide">Amount (₹)<input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></label>
      </div><div className="form-summary"><span>Available balance</span><strong>{money(active.balance)}</strong></div><button className="primary action-button" onClick={()=>action(screen==='bills'?'bill':screen)}>{screen==='bills'?'Pay now':screen==='transfer'?'Send money':screen==='deposit'?'Deposit funds':'Withdraw funds'} <ArrowUpRight size={17}/></button></section>}
      {screen==='transactions'&&<section className="panel"><div className="panel-head"><div><h3>All transactions</h3><p>Review and download your account activity</p></div><button className="outline-button" onClick={exportCsv}><Download size={16}/> Export CSV</button></div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions"/></div><TransactionList items={filtered}/></section>}
      {screen==='profile'&&<section className="panel profile-panel"><div className="profile-hero"><div className="profile-avatar">{active.name.slice(0,1).toUpperCase()}</div><div><h3>{active.name}</h3><p>{active.email}</p></div></div><div className="profile-details"><div><span>Full name</span><strong>{active.name}</strong></div><div><span>Email address</span><strong>{active.email}</strong></div><div><span>Mobile number</span><strong>{active.phone||'Not provided'}</strong></div><div><span>Account number</span><strong>{active.accountNo}</strong></div><div><span>Account type</span><strong>Savings account</strong></div><div><span>Account status</span><strong className="status-active">Active</strong></div></div></section>}
      <footer className="page-footer">Everyday Banking <span>•</span> Student project demonstration</footer>
    </div></main>
  </div>
}

function TransactionList({items}){
  if(!items.length)return <div className="empty-state"><div className="empty-icon"><ReceiptText/></div><strong>No transactions yet</strong><span>Your account activity will appear here.</span></div>;
  return <div className="transaction-list">{items.map(t=>{const incoming=['Deposit','Transfer received'].includes(t.type);return <div className="transaction-row" key={t.id}><div className={`transaction-icon ${incoming?'incoming':'outgoing'}`}>{incoming?<ArrowDownLeft size={18}/>:<ArrowUpRight size={18}/>}</div><div className="transaction-info"><strong>{t.type}</strong><span>{t.note}</span></div><div className="transaction-date">{t.date}</div><strong className={`transaction-amount ${incoming?'positive':''}`}>{incoming?'+':'−'}{money(t.amount)}</strong></div>})}</div>;
}