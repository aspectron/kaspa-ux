import {isSmallScreen as _isSmallScreen} from './flow-ux.js';
window.mobileMode = window.localStorage?.getItem("mobileMode")==1||false;
let isMobile = window.mobileMode?true:_isSmallScreen;
window.isMobile = isMobile;

import {helper, Storage} from '@kaspa/wallet-worker';
export const {Deferred, KAS, Decimal} = helper;
const storage = new Storage({logLevel:'debug'});
let {baseUrl, debug, MAX_UTXOS_THRESHOLD=1000, dontInitiatedComponent=false} = window.KaspaConfig || {};
if(!baseUrl){
	baseUrl = (new URL("../", import.meta.url)).href;
	debug && console.log("KaspaUX: baseUrl", baseUrl)
}
export {baseUrl, debug, isMobile, dontInitiatedComponent}

export const MAX_UTXOS_THRESHOLD_COMPOUND = MAX_UTXOS_THRESHOLD;

/*
const {Wallet, initKaspaFramework, Storage} = require("kaspa-wallet-worker");
let {Mnemonic} = Wallet;
console.log("Wallet", Wallet)
window.testSeed = new Mnemonic(Mnemonic.Words.ENGLISH).toString();
console.log("test Mnemonic: ", window.testSeed)
const crypto = require('crypto');
const storage = new Storage({logLevel:'debug'});

export const {RPC} = require("kaspa-grpc-node");
*/

import {html, css} from './flow-ux.js';

export const GetTS = (d=null)=>{
    d = d || new Date();
    let year = d.getFullYear();
    let month = d.getMonth()+1; month = month < 10 ? '0' + month : month;
    let date = d.getDate(); date = date < 10 ? '0' + date : date;
    let hour = d.getHours(); hour = hour < 10 ? '0' + hour : hour;
    let min = d.getMinutes(); min = min < 10 ? '0' + min : min;
    let sec = d.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
    //var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
    return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
}

/**
 * Converts from sompis to KAS
 * @param val Value to convert, as string or number
 * @returns Converted value as a string
 */
export const formatForHuman = (val)=>{
  return String(Number(val) / 1e8 );
}

/**
 * Converts from KAS to sompis
 * @param val Value to convert, as string or number
 * @returns Converted value as a string
 */
export const formatForMachine = (val)=>{
  return Number(val) * 1e8;
}

export const getLocalWallet = ()=>{
	let meta = storage.getWallet();
	if(!meta)
		return false;
	if(meta.wallet)
		meta.mnemonic = meta.wallet.mnemonic;
	return meta;
}

export const setLocalWallet = async (wallet, meta={})=>{
	let oldWallet = await getLocalWallet();
	if(oldWallet)
		return storage.createWallet(wallet, meta)

	return storage.saveWallet(wallet, meta);
}

export const getCacheFromStorage = ()=>{
	return storage.getCache();
}

export const saveCacheToStorage = (cache)=>{
	storage.saveCache(cache);
}


export const getUniqueId = (mnemonic)=>{
	const secret = 'c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e';
	/*
	return crypto.createHmac('sha256', secret)
		.update(mnemonic)
		.digest('hex');
	*/
	return crypto.scryptSync(mnemonic, secret, 20, { N: 1024 }).toString('hex');
}

export const validatePassword = (password)=>{
	const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
	return regex.test(password);
}

export const askForPassword = async (args, callback)=>{
	if(typeof args == 'function'){
		callback = args;
		args = {};
	}
	const {
		confirmBtnText="CONFIRM",
		confirmBtnValue="confirm",
		pass="",
		msg="",
		title="Enter a password"
	} = args||{}
	let inputType = "password";
	let icon = "eye";
	let errorMessage = "";
	const updateDialog = ()=>{
		dialog.body = body();
		//dialog.requestUpdate("body", null)
	}
	const changeInputType = ()=>{
		inputType = inputType=="password"?"text":"password";
		icon = inputType=="password"?'eye':'eye-slash';
		updateDialog();
	}
	let body = ()=>{
		return html`
			<div class="msg">${msg}</div>
			<flow-input class="password full-width" outer-border
				name="password" type="${inputType}" placeholder="Password"
				value="${pass}">
				<fa-icon class="fa-btn"
					slot="sufix"
					@click="${changeInputType}"
					icon="${icon}"></fa-icon>
			</flow-input>
			<div class="error-msg">${errorMessage}</div>
		`
	}

	const p = FlowDialog.show({
		title,
		body:body(),
		cls:"short-dialog",
		btns:['Cancel',{
			text:confirmBtnText,
			cls:'primary',
			value:confirmBtnValue,
			handler(resolve, result){
				let {values} = result;
				let {password} = values;
				if(!validatePassword(password)){
					errorMessage = `At least 8 characters, one capital, one lower,
    				one number, and one symbol`
    				updateDialog()
    				return
    			}
				resolve(result)
			}
		}]
	});
	const {dialog} = p;
	const result = await p;
	result.password = result?.values?.password;
	callback(result)
}

window.Decimal = Decimal;
window.askForPassword = askForPassword;
