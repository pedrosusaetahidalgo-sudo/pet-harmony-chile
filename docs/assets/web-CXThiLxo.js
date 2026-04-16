import{aq as dt}from"./index-qURCwNfD.js";import{ConsentStatus as ut,ConsentType as v}from"./index-Cv9tOaLG.js";import"./query-vendor-CTHCfVos.js";import"./react-vendor-B-V0GPsE.js";import"./ui-vendor-IHhQffqh.js";import"./recharts-vendor-eBNZVrRN.js";import"./icons-vendor-D-DEqUBx.js";import"./supabase-vendor-BCFZu5me.js";import"./date-vendor-D81PEiL8.js";import"./leaflet-vendor-DCbbkXe_.js";const ft=()=>{};var le={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ve=function(t){const e=[];let n=0;for(let r=0;r<t.length;r++){let a=t.charCodeAt(r);a<128?e[n++]=a:a<2048?(e[n++]=a>>6|192,e[n++]=a&63|128):(a&64512)===55296&&r+1<t.length&&(t.charCodeAt(r+1)&64512)===56320?(a=65536+((a&1023)<<10)+(t.charCodeAt(++r)&1023),e[n++]=a>>18|240,e[n++]=a>>12&63|128,e[n++]=a>>6&63|128,e[n++]=a&63|128):(e[n++]=a>>12|224,e[n++]=a>>6&63|128,e[n++]=a&63|128)}return e},ht=function(t){const e=[];let n=0,r=0;for(;n<t.length;){const a=t[n++];if(a<128)e[r++]=String.fromCharCode(a);else if(a>191&&a<224){const s=t[n++];e[r++]=String.fromCharCode((a&31)<<6|s&63)}else if(a>239&&a<365){const s=t[n++],i=t[n++],o=t[n++],c=((a&7)<<18|(s&63)<<12|(i&63)<<6|o&63)-65536;e[r++]=String.fromCharCode(55296+(c>>10)),e[r++]=String.fromCharCode(56320+(c&1023))}else{const s=t[n++],i=t[n++];e[r++]=String.fromCharCode((a&15)<<12|(s&63)<<6|i&63)}}return e.join("")},Re={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let a=0;a<t.length;a+=3){const s=t[a],i=a+1<t.length,o=i?t[a+1]:0,c=a+2<t.length,l=c?t[a+2]:0,h=s>>2,f=(s&3)<<4|o>>4;let p=(o&15)<<2|l>>6,$=l&63;c||($=64,i||(p=64)),r.push(n[h],n[f],n[p],n[$])}return r.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(ve(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):ht(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let a=0;a<t.length;){const s=n[t.charAt(a++)],o=a<t.length?n[t.charAt(a)]:0;++a;const l=a<t.length?n[t.charAt(a)]:64;++a;const f=a<t.length?n[t.charAt(a)]:64;if(++a,s==null||o==null||l==null||f==null)throw new pt;const p=s<<2|o>>4;if(r.push(p),l!==64){const $=o<<4&240|l>>2;if(r.push($),f!==64){const lt=l<<6&192|f;r.push(lt)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class pt extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const mt=function(t){const e=ve(t);return Re.encodeByteArray(e,!0)},Me=function(t){return mt(t).replace(/\./g,"")},gt=function(t){try{return Re.decodeString(t,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yt=()=>bt().__FIREBASE_DEFAULTS__,wt=()=>{if(typeof process>"u"||typeof le>"u")return;const t=le.__FIREBASE_DEFAULTS__;if(t)return JSON.parse(t)},It=()=>{if(typeof document>"u")return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=t&&gt(t[1]);return e&&JSON.parse(e)},Et=()=>{try{return ft()||yt()||wt()||It()}catch(t){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);return}},Be=()=>{var t;return(t=Et())==null?void 0:t.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _t{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,r))}}}function At(){const t=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof t=="object"&&t.id!==void 0}function Oe(){try{return typeof indexedDB=="object"}catch{return!1}}function $e(){return new Promise((t,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",a=self.indexedDB.open(r);a.onsuccess=()=>{a.result.close(),n||self.indexedDB.deleteDatabase(r),t(!0)},a.onupgradeneeded=()=>{n=!1},a.onerror=()=>{var s;e(((s=a.error)==null?void 0:s.message)||"")}}catch(n){e(n)}})}function St(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tt="FirebaseError";class D extends Error{constructor(e,n,r){super(n),this.code=e,this.customData=r,this.name=Tt,Object.setPrototypeOf(this,D.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,L.prototype.create)}}class L{constructor(e,n,r){this.service=e,this.serviceName=n,this.errors=r}create(e,...n){const r=n[0]||{},a=`${this.service}/${e}`,s=this.errors[e],i=s?Ct(s,r):"Error",o=`${this.serviceName}: ${i} (${a}).`;return new D(a,o,r)}}function Ct(t,e){return t.replace(Dt,(n,r)=>{const a=e[r];return a!=null?String(a):`<${r}?>`})}const Dt=/\{\$([^}]+)}/g;function P(t,e){if(t===e)return!0;const n=Object.keys(t),r=Object.keys(e);for(const a of n){if(!r.includes(a))return!1;const s=t[a],i=e[a];if(de(s)&&de(i)){if(!P(s,i))return!1}else if(s!==i)return!1}for(const a of r)if(!n.includes(a))return!1;return!0}function de(t){return t!==null&&typeof t=="object"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vt=1e3,Rt=2,Mt=4*60*60*1e3,Bt=.5;function ue(t,e=vt,n=Rt){const r=e*Math.pow(n,t),a=Math.round(Bt*r*(Math.random()-.5)*2);return Math.min(Mt,r+a)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function O(t){return t&&t._delegate?t._delegate:t}class I{constructor(e,n,r){this.name=e,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const E="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const r=new _t;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const a=this.getOrInitializeService({instanceIdentifier:n});a&&r.resolve(a)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(a){if(r)return null;throw a}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Pt(e))try{this.getOrInitializeService({instanceIdentifier:E})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(n);try{const s=this.getOrInitializeService({instanceIdentifier:a});r.resolve(s)}catch{}}}}clearInstance(e=E){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=E){return this.instances.has(e)}getOptions(e=E){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const a=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[s,i]of this.instancesDeferred.entries()){const o=this.normalizeInstanceIdentifier(s);r===o&&i.resolve(a)}return a}onInit(e,n){const r=this.normalizeInstanceIdentifier(n),a=this.onInitCallbacks.get(r)??new Set;a.add(e),this.onInitCallbacks.set(r,a);const s=this.instances.get(r);return s&&e(s,r),()=>{a.delete(e)}}invokeOnInitCallbacks(e,n){const r=this.onInitCallbacks.get(n);if(r)for(const a of r)try{a(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:$t(e),options:n}),this.instances.set(e,r),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=E){return this.component?this.component.multipleInstances?e:E:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function $t(t){return t===E?void 0:t}function Pt(t){return t.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nt{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new Ot(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var d;(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(d||(d={}));const kt={debug:d.DEBUG,verbose:d.VERBOSE,info:d.INFO,warn:d.WARN,error:d.ERROR,silent:d.SILENT},Ft=d.INFO,Lt={[d.DEBUG]:"log",[d.VERBOSE]:"log",[d.INFO]:"info",[d.WARN]:"warn",[d.ERROR]:"error"},xt=(t,e,...n)=>{if(e<t.logLevel)return;const r=new Date().toISOString(),a=Lt[e];if(a)console[a](`[${r}]  ${t.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Pe{constructor(e){this.name=e,this._logLevel=Ft,this._logHandler=xt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in d))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?kt[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,d.DEBUG,...e),this._logHandler(this,d.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,d.VERBOSE,...e),this._logHandler(this,d.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,d.INFO,...e),this._logHandler(this,d.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,d.WARN,...e),this._logHandler(this,d.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,d.ERROR,...e),this._logHandler(this,d.ERROR,...e)}}const Ht=(t,e)=>e.some(n=>t instanceof n);let fe,he;function Ut(){return fe||(fe=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function jt(){return he||(he=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Ne=new WeakMap,Y=new WeakMap,ke=new WeakMap,j=new WeakMap,re=new WeakMap;function Vt(t){const e=new Promise((n,r)=>{const a=()=>{t.removeEventListener("success",s),t.removeEventListener("error",i)},s=()=>{n(b(t.result)),a()},i=()=>{r(t.error),a()};t.addEventListener("success",s),t.addEventListener("error",i)});return e.then(n=>{n instanceof IDBCursor&&Ne.set(n,t)}).catch(()=>{}),re.set(e,t),e}function zt(t){if(Y.has(t))return;const e=new Promise((n,r)=>{const a=()=>{t.removeEventListener("complete",s),t.removeEventListener("error",i),t.removeEventListener("abort",i)},s=()=>{n(),a()},i=()=>{r(t.error||new DOMException("AbortError","AbortError")),a()};t.addEventListener("complete",s),t.addEventListener("error",i),t.addEventListener("abort",i)});Y.set(t,e)}let J={get(t,e,n){if(t instanceof IDBTransaction){if(e==="done")return Y.get(t);if(e==="objectStoreNames")return t.objectStoreNames||ke.get(t);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return b(t[e])},set(t,e,n){return t[e]=n,!0},has(t,e){return t instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in t}};function Wt(t){J=t(J)}function qt(t){return t===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const r=t.call(V(this),e,...n);return ke.set(r,e.sort?e.sort():[e]),b(r)}:jt().includes(t)?function(...e){return t.apply(V(this),e),b(Ne.get(this))}:function(...e){return b(t.apply(V(this),e))}}function Gt(t){return typeof t=="function"?qt(t):(t instanceof IDBTransaction&&zt(t),Ht(t,Ut())?new Proxy(t,J):t)}function b(t){if(t instanceof IDBRequest)return Vt(t);if(j.has(t))return j.get(t);const e=Gt(t);return e!==t&&(j.set(t,e),re.set(e,t)),e}const V=t=>re.get(t);function Fe(t,e,{blocked:n,upgrade:r,blocking:a,terminated:s}={}){const i=indexedDB.open(t,e),o=b(i);return r&&i.addEventListener("upgradeneeded",c=>{r(b(i.result),c.oldVersion,c.newVersion,b(i.transaction),c)}),n&&i.addEventListener("blocked",c=>n(c.oldVersion,c.newVersion,c)),o.then(c=>{s&&c.addEventListener("close",()=>s()),a&&c.addEventListener("versionchange",l=>a(l.oldVersion,l.newVersion,l))}).catch(()=>{}),o}const Kt=["get","getKey","getAll","getAllKeys","count"],Yt=["put","add","delete","clear"],z=new Map;function pe(t,e){if(!(t instanceof IDBDatabase&&!(e in t)&&typeof e=="string"))return;if(z.get(e))return z.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,a=Yt.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(a||Kt.includes(n)))return;const s=async function(i,...o){const c=this.transaction(i,a?"readwrite":"readonly");let l=c.store;return r&&(l=l.index(o.shift())),(await Promise.all([l[n](...o),a&&c.done]))[0]};return z.set(e,s),s}Wt(t=>({...t,get:(e,n,r)=>pe(e,n)||t.get(e,n,r),has:(e,n)=>!!pe(e,n)||t.has(e,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jt{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(Xt(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function Xt(t){const e=t.getComponent();return(e==null?void 0:e.type)==="VERSION"}const X="@firebase/app",me="0.14.11";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const g=new Pe("@firebase/app"),Zt="@firebase/app-compat",Qt="@firebase/analytics-compat",en="@firebase/analytics",tn="@firebase/app-check-compat",nn="@firebase/app-check",rn="@firebase/auth",an="@firebase/auth-compat",sn="@firebase/database",on="@firebase/data-connect",cn="@firebase/database-compat",ln="@firebase/functions",dn="@firebase/functions-compat",un="@firebase/installations",fn="@firebase/installations-compat",hn="@firebase/messaging",pn="@firebase/messaging-compat",mn="@firebase/performance",gn="@firebase/performance-compat",bn="@firebase/remote-config",yn="@firebase/remote-config-compat",wn="@firebase/storage",In="@firebase/storage-compat",En="@firebase/firestore",_n="@firebase/ai",An="@firebase/firestore-compat",Sn="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Z="[DEFAULT]",Tn={[X]:"fire-core",[Zt]:"fire-core-compat",[en]:"fire-analytics",[Qt]:"fire-analytics-compat",[nn]:"fire-app-check",[tn]:"fire-app-check-compat",[rn]:"fire-auth",[an]:"fire-auth-compat",[sn]:"fire-rtdb",[on]:"fire-data-connect",[cn]:"fire-rtdb-compat",[ln]:"fire-fn",[dn]:"fire-fn-compat",[un]:"fire-iid",[fn]:"fire-iid-compat",[hn]:"fire-fcm",[pn]:"fire-fcm-compat",[mn]:"fire-perf",[gn]:"fire-perf-compat",[bn]:"fire-rc",[yn]:"fire-rc-compat",[wn]:"fire-gcs",[In]:"fire-gcs-compat",[En]:"fire-fst",[An]:"fire-fst-compat",[_n]:"fire-vertex","fire-js":"fire-js",[Sn]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const N=new Map,Cn=new Map,Q=new Map;function ge(t,e){try{t.container.addComponent(e)}catch(n){g.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function S(t){const e=t.name;if(Q.has(e))return g.debug(`There were multiple attempts to register component ${e}.`),!1;Q.set(e,t);for(const n of N.values())ge(n,t);for(const n of Cn.values())ge(n,t);return!0}function x(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},y=new L("app","Firebase",Dn);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vn{constructor(e,n,r){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new I("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw y.create("app-deleted",{appName:this._name})}}function Rn(t,e={}){let n=t;typeof e!="object"&&(e={name:e});const r={name:Z,automaticDataCollectionEnabled:!0,...e},a=r.name;if(typeof a!="string"||!a)throw y.create("bad-app-name",{appName:String(a)});if(n||(n=Be()),!n)throw y.create("no-options");const s=N.get(a);if(s){if(P(n,s.options)&&P(r,s.config))return s;throw y.create("duplicate-app",{appName:a})}const i=new Nt(a);for(const c of Q.values())i.addComponent(c);const o=new vn(n,r,i);return N.set(a,o),o}function Mn(t=Z){const e=N.get(t);if(!e&&t===Z&&Be())return Rn();if(!e)throw y.create("no-app",{appName:t});return e}function A(t,e,n){let r=Tn[t]??t;n&&(r+=`-${n}`);const a=r.match(/\s|\//),s=e.match(/\s|\//);if(a||s){const i=[`Unable to register library "${r}" with version "${e}":`];a&&i.push(`library name "${r}" contains illegal characters (whitespace or "/")`),a&&s&&i.push("and"),s&&i.push(`version name "${e}" contains illegal characters (whitespace or "/")`),g.warn(i.join(" "));return}S(new I(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bn="firebase-heartbeat-database",On=1,B="firebase-heartbeat-store";let W=null;function Le(){return W||(W=Fe(Bn,On,{upgrade:(t,e)=>{switch(e){case 0:try{t.createObjectStore(B)}catch(n){console.warn(n)}}}}).catch(t=>{throw y.create("idb-open",{originalErrorMessage:t.message})})),W}async function $n(t){try{const n=(await Le()).transaction(B),r=await n.objectStore(B).get(xe(t));return await n.done,r}catch(e){if(e instanceof D)g.warn(e.message);else{const n=y.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});g.warn(n.message)}}}async function be(t,e){try{const r=(await Le()).transaction(B,"readwrite");await r.objectStore(B).put(e,xe(t)),await r.done}catch(n){if(n instanceof D)g.warn(n.message);else{const r=y.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});g.warn(r.message)}}}function xe(t){return`${t.name}!${t.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pn=1024,Nn=30;class kn{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new Ln(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,n;try{const a=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=ye();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(i=>i.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:a}),this._heartbeatsCache.heartbeats.length>Nn){const i=xn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){g.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=ye(),{heartbeatsToSend:r,unsentEntries:a}=Fn(this._heartbeatsCache.heartbeats),s=Me(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,a.length>0?(this._heartbeatsCache.heartbeats=a,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(n){return g.warn(n),""}}}function ye(){return new Date().toISOString().substring(0,10)}function Fn(t,e=Pn){const n=[];let r=t.slice();for(const a of t){const s=n.find(i=>i.agent===a.agent);if(s){if(s.dates.push(a.date),we(n)>e){s.dates.pop();break}}else if(n.push({agent:a.agent,dates:[a.date]}),we(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class Ln{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Oe()?$e().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await $n(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return be(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return be(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function we(t){return Me(JSON.stringify({version:2,heartbeats:t})).length}function xn(t){if(t.length===0)return-1;let e=0,n=t[0].date;for(let r=1;r<t.length;r++)t[r].date<n&&(n=t[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Hn(t){S(new I("platform-logger",e=>new Jt(e),"PRIVATE")),S(new I("heartbeat",e=>new kn(e),"PRIVATE")),A(X,me,t),A(X,me,"esm2020"),A("fire-js","")}Hn("");const He="@firebase/installations",ae="0.6.21";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ue=1e4,je=`w:${ae}`,Ve="FIS_v2",Un="https://firebaseinstallations.googleapis.com/v1",jn=60*60*1e3,Vn="installations",zn="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wn={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},T=new L(Vn,zn,Wn);function ze(t){return t instanceof D&&t.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function We({projectId:t}){return`${Un}/projects/${t}/installations`}function qe(t){return{token:t.token,requestStatus:2,expiresIn:Gn(t.expiresIn),creationTime:Date.now()}}async function Ge(t,e){const r=(await e.json()).error;return T.create("request-failed",{requestName:t,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function Ke({apiKey:t}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":t})}function qn(t,{refreshToken:e}){const n=Ke(t);return n.append("Authorization",Kn(e)),n}async function Ye(t){const e=await t();return e.status>=500&&e.status<600?t():e}function Gn(t){return Number(t.replace("s","000"))}function Kn(t){return`${Ve} ${t}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Yn({appConfig:t,heartbeatServiceProvider:e},{fid:n}){const r=We(t),a=Ke(t),s=e.getImmediate({optional:!0});if(s){const l=await s.getHeartbeatsHeader();l&&a.append("x-firebase-client",l)}const i={fid:n,authVersion:Ve,appId:t.appId,sdkVersion:je},o={method:"POST",headers:a,body:JSON.stringify(i)},c=await Ye(()=>fetch(r,o));if(c.ok){const l=await c.json();return{fid:l.fid||n,registrationStatus:2,refreshToken:l.refreshToken,authToken:qe(l.authToken)}}else throw await Ge("Create Installation",c)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Je(t){return new Promise(e=>{setTimeout(e,t)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jn(t){return btoa(String.fromCharCode(...t)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xn=/^[cdef][\w-]{21}$/,ee="";function Zn(){try{const t=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(t),t[0]=112+t[0]%16;const n=Qn(t);return Xn.test(n)?n:ee}catch{return ee}}function Qn(t){return Jn(t).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function H(t){return`${t.appName}!${t.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe=new Map;function Ze(t,e){const n=H(t);Qe(n,e),er(n,e)}function Qe(t,e){const n=Xe.get(t);if(n)for(const r of n)r(e)}function er(t,e){const n=tr();n&&n.postMessage({key:t,fid:e}),nr()}let _=null;function tr(){return!_&&"BroadcastChannel"in self&&(_=new BroadcastChannel("[Firebase] FID Change"),_.onmessage=t=>{Qe(t.data.key,t.data.fid)}),_}function nr(){Xe.size===0&&_&&(_.close(),_=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rr="firebase-installations-database",ar=1,C="firebase-installations-store";let q=null;function se(){return q||(q=Fe(rr,ar,{upgrade:(t,e)=>{switch(e){case 0:t.createObjectStore(C)}}})),q}async function k(t,e){const n=H(t),a=(await se()).transaction(C,"readwrite"),s=a.objectStore(C),i=await s.get(n);return await s.put(e,n),await a.done,(!i||i.fid!==e.fid)&&Ze(t,e.fid),e}async function et(t){const e=H(t),r=(await se()).transaction(C,"readwrite");await r.objectStore(C).delete(e),await r.done}async function U(t,e){const n=H(t),a=(await se()).transaction(C,"readwrite"),s=a.objectStore(C),i=await s.get(n),o=e(i);return o===void 0?await s.delete(n):await s.put(o,n),await a.done,o&&(!i||i.fid!==o.fid)&&Ze(t,o.fid),o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ie(t){let e;const n=await U(t.appConfig,r=>{const a=sr(r),s=ir(t,a);return e=s.registrationPromise,s.installationEntry});return n.fid===ee?{installationEntry:await e}:{installationEntry:n,registrationPromise:e}}function sr(t){const e=t||{fid:Zn(),registrationStatus:0};return tt(e)}function ir(t,e){if(e.registrationStatus===0){if(!navigator.onLine){const a=Promise.reject(T.create("app-offline"));return{installationEntry:e,registrationPromise:a}}const n={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},r=or(t,n);return{installationEntry:n,registrationPromise:r}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:cr(t)}:{installationEntry:e}}async function or(t,e){try{const n=await Yn(t,e);return k(t.appConfig,n)}catch(n){throw ze(n)&&n.customData.serverCode===409?await et(t.appConfig):await k(t.appConfig,{fid:e.fid,registrationStatus:0}),n}}async function cr(t){let e=await Ie(t.appConfig);for(;e.registrationStatus===1;)await Je(100),e=await Ie(t.appConfig);if(e.registrationStatus===0){const{installationEntry:n,registrationPromise:r}=await ie(t);return r||n}return e}function Ie(t){return U(t,e=>{if(!e)throw T.create("installation-not-found");return tt(e)})}function tt(t){return lr(t)?{fid:t.fid,registrationStatus:0}:t}function lr(t){return t.registrationStatus===1&&t.registrationTime+Ue<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dr({appConfig:t,heartbeatServiceProvider:e},n){const r=ur(t,n),a=qn(t,n),s=e.getImmediate({optional:!0});if(s){const l=await s.getHeartbeatsHeader();l&&a.append("x-firebase-client",l)}const i={installation:{sdkVersion:je,appId:t.appId}},o={method:"POST",headers:a,body:JSON.stringify(i)},c=await Ye(()=>fetch(r,o));if(c.ok){const l=await c.json();return qe(l)}else throw await Ge("Generate Auth Token",c)}function ur(t,{fid:e}){return`${We(t)}/${e}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function oe(t,e=!1){let n;const r=await U(t.appConfig,s=>{if(!nt(s))throw T.create("not-registered");const i=s.authToken;if(!e&&pr(i))return s;if(i.requestStatus===1)return n=fr(t,e),s;{if(!navigator.onLine)throw T.create("app-offline");const o=gr(s);return n=hr(t,o),o}});return n?await n:r.authToken}async function fr(t,e){let n=await Ee(t.appConfig);for(;n.authToken.requestStatus===1;)await Je(100),n=await Ee(t.appConfig);const r=n.authToken;return r.requestStatus===0?oe(t,e):r}function Ee(t){return U(t,e=>{if(!nt(e))throw T.create("not-registered");const n=e.authToken;return br(n)?{...e,authToken:{requestStatus:0}}:e})}async function hr(t,e){try{const n=await dr(t,e),r={...e,authToken:n};return await k(t.appConfig,r),n}catch(n){if(ze(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await et(t.appConfig);else{const r={...e,authToken:{requestStatus:0}};await k(t.appConfig,r)}throw n}}function nt(t){return t!==void 0&&t.registrationStatus===2}function pr(t){return t.requestStatus===2&&!mr(t)}function mr(t){const e=Date.now();return e<t.creationTime||t.creationTime+t.expiresIn<e+jn}function gr(t){const e={requestStatus:1,requestTime:Date.now()};return{...t,authToken:e}}function br(t){return t.requestStatus===1&&t.requestTime+Ue<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yr(t){const e=t,{installationEntry:n,registrationPromise:r}=await ie(e);return r?r.catch(console.error):oe(e).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function wr(t,e=!1){const n=t;return await Ir(n),(await oe(n,e)).token}async function Ir(t){const{registrationPromise:e}=await ie(t);e&&await e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Er(t){if(!t||!t.options)throw G("App Configuration");if(!t.name)throw G("App Name");const e=["projectId","apiKey","appId"];for(const n of e)if(!t.options[n])throw G(n);return{appName:t.name,projectId:t.options.projectId,apiKey:t.options.apiKey,appId:t.options.appId}}function G(t){return T.create("missing-app-config-values",{valueName:t})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rt="installations",_r="installations-internal",Ar=t=>{const e=t.getProvider("app").getImmediate(),n=Er(e),r=x(e,"heartbeat");return{app:e,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Sr=t=>{const e=t.getProvider("app").getImmediate(),n=x(e,rt).getImmediate();return{getId:()=>yr(n),getToken:a=>wr(n,a)}};function Tr(){S(new I(rt,Ar,"PUBLIC")),S(new I(_r,Sr,"PRIVATE"))}Tr();A(He,ae);A(He,ae,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const F="analytics",Cr="firebase_id",Dr="origin",vr=60*1e3,Rr="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig",ce="https://www.googletagmanager.com/gtag/js";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const u=new Pe("@firebase/analytics");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mr={"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."},m=new L("analytics","Analytics",Mr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Br(t){if(!t.startsWith(ce)){const e=m.create("invalid-gtag-resource",{gtagURL:t});return u.warn(e.message),""}return t}function at(t){return Promise.all(t.map(e=>e.catch(n=>n)))}function Or(t,e){let n;return window.trustedTypes&&(n=window.trustedTypes.createPolicy(t,e)),n}function $r(t,e){const n=Or("firebase-js-sdk-policy",{createScriptURL:Br}),r=document.createElement("script"),a=`${ce}?l=${t}&id=${e}`;r.src=n?n==null?void 0:n.createScriptURL(a):a,r.async=!0,document.head.appendChild(r)}function Pr(t){let e=[];return Array.isArray(window[t])?e=window[t]:window[t]=e,e}async function Nr(t,e,n,r,a,s){const i=r[a];try{if(i)await e[i];else{const c=(await at(n)).find(l=>l.measurementId===a);c&&await e[c.appId]}}catch(o){u.error(o)}t("config",a,s)}async function kr(t,e,n,r,a){try{let s=[];if(a&&a.send_to){let i=a.send_to;Array.isArray(i)||(i=[i]);const o=await at(n);for(const c of i){const l=o.find(f=>f.measurementId===c),h=l&&e[l.appId];if(h)s.push(h);else{s=[];break}}}s.length===0&&(s=Object.values(e)),await Promise.all(s),t("event",r,a||{})}catch(s){u.error(s)}}function Fr(t,e,n,r){async function a(s,...i){try{if(s==="event"){const[o,c]=i;await kr(t,e,n,o,c)}else if(s==="config"){const[o,c]=i;await Nr(t,e,n,r,o,c)}else if(s==="consent"){const[o,c]=i;t("consent",o,c)}else if(s==="get"){const[o,c,l]=i;t("get",o,c,l)}else if(s==="set"){const[o]=i;t("set",o)}else t(s,...i)}catch(o){u.error(o)}}return a}function Lr(t,e,n,r,a){let s=function(...i){window[r].push(arguments)};return window[a]&&typeof window[a]=="function"&&(s=window[a]),window[a]=Fr(s,t,e,n),{gtagCore:s,wrappedGtag:window[a]}}function xr(t){const e=window.document.getElementsByTagName("script");for(const n of Object.values(e))if(n.src&&n.src.includes(ce)&&n.src.includes(t))return n;return null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hr=30,Ur=1e3;class jr{constructor(e={},n=Ur){this.throttleMetadata=e,this.intervalMillis=n}getThrottleMetadata(e){return this.throttleMetadata[e]}setThrottleMetadata(e,n){this.throttleMetadata[e]=n}deleteThrottleMetadata(e){delete this.throttleMetadata[e]}}const st=new jr;function Vr(t){return new Headers({Accept:"application/json","x-goog-api-key":t})}async function zr(t){var i;const{appId:e,apiKey:n}=t,r={method:"GET",headers:Vr(n)},a=Rr.replace("{app-id}",e),s=await fetch(a,r);if(s.status!==200&&s.status!==304){let o="";try{const c=await s.json();(i=c.error)!=null&&i.message&&(o=c.error.message)}catch{}throw m.create("config-fetch-failed",{httpStatus:s.status,responseMessage:o})}return s.json()}async function Wr(t,e=st,n){const{appId:r,apiKey:a,measurementId:s}=t.options;if(!r)throw m.create("no-app-id");if(!a){if(s)return{measurementId:s,appId:r};throw m.create("no-api-key")}const i=e.getThrottleMetadata(r)||{backoffCount:0,throttleEndTimeMillis:Date.now()},o=new Kr;return setTimeout(async()=>{o.abort()},vr),it({appId:r,apiKey:a,measurementId:s},i,o,e)}async function it(t,{throttleEndTimeMillis:e,backoffCount:n},r,a=st){var o;const{appId:s,measurementId:i}=t;try{await qr(r,e)}catch(c){if(i)return u.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${i} provided in the "measurementId" field in the local Firebase config. [${c==null?void 0:c.message}]`),{appId:s,measurementId:i};throw c}try{const c=await zr(t);return a.deleteThrottleMetadata(s),c}catch(c){const l=c;if(!Gr(l)){if(a.deleteThrottleMetadata(s),i)return u.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${i} provided in the "measurementId" field in the local Firebase config. [${l==null?void 0:l.message}]`),{appId:s,measurementId:i};throw c}const h=Number((o=l==null?void 0:l.customData)==null?void 0:o.httpStatus)===503?ue(n,a.intervalMillis,Hr):ue(n,a.intervalMillis),f={throttleEndTimeMillis:Date.now()+h,backoffCount:n+1};return a.setThrottleMetadata(s,f),u.debug(`Calling attemptFetch again in ${h} millis`),it(t,f,r,a)}}function qr(t,e){return new Promise((n,r)=>{const a=Math.max(e-Date.now(),0),s=setTimeout(n,a);t.addEventListener(()=>{clearTimeout(s),r(m.create("fetch-throttle",{throttleEndTimeMillis:e}))})})}function Gr(t){if(!(t instanceof D)||!t.customData)return!1;const e=Number(t.customData.httpStatus);return e===429||e===500||e===503||e===504}class Kr{constructor(){this.listeners=[]}addEventListener(e){this.listeners.push(e)}abort(){this.listeners.forEach(e=>e())}}async function Yr(t,e,n,r,a){if(a&&a.global){t("event",n,r);return}else{const s=await e,i={...r,send_to:s};t("event",n,i)}}async function Jr(t,e,n,r){{const a=await e;t("config",a,{update:!0,user_id:n})}}async function Xr(t,e,n,r){if(r&&r.global){const a={};for(const s of Object.keys(n))a[`user_properties.${s}`]=n[s];return t("set",a),Promise.resolve()}else{const a=await e;t("config",a,{update:!0,user_properties:n})}}async function Zr(t,e){const n=await t;window[`ga-disable-${n}`]=!e}let te;function ot(t){te=t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Qr(){if(Oe())try{await $e()}catch(t){return u.warn(m.create("indexeddb-unavailable",{errorInfo:t==null?void 0:t.toString()}).message),!1}else return u.warn(m.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;return!0}async function ea(t,e,n,r,a,s,i){const o=Wr(t);o.then(p=>{n[p.measurementId]=p.appId,t.options.measurementId&&p.measurementId!==t.options.measurementId&&u.warn(`The measurement ID in the local Firebase config (${t.options.measurementId}) does not match the measurement ID fetched from the server (${p.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)}).catch(p=>u.error(p)),e.push(o);const c=Qr().then(p=>{if(p)return r.getId()}),[l,h]=await Promise.all([o,c]);xr(s)||$r(s,l.measurementId),te&&(a("consent","default",te),ot(void 0)),a("js",new Date);const f=(i==null?void 0:i.config)??{};return f[Dr]="firebase",f.update=!0,h!=null&&(f[Cr]=h),a("config",l.measurementId,f),l.measurementId}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ta{constructor(e){this.app=e}_delete(){return delete w[this.app.options.appId],Promise.resolve()}}let w={},_e=[];const Ae={};let K="dataLayer",na="gtag",Se,R,Te=!1;function ra(){const t=[];if(At()&&t.push("This is a browser extension environment."),St()||t.push("Cookies are not available."),t.length>0){const e=t.map((r,a)=>`(${a+1}) ${r}`).join(" "),n=m.create("invalid-analytics-context",{errorInfo:e});u.warn(n.message)}}function aa(t,e,n){ra();const r=t.options.appId;if(!r)throw m.create("no-app-id");if(!t.options.apiKey)if(t.options.measurementId)u.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${t.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);else throw m.create("no-api-key");if(w[r]!=null)throw m.create("already-exists",{id:r});if(!Te){Pr(K);const{wrappedGtag:s,gtagCore:i}=Lr(w,_e,Ae,K,na);R=s,Se=i,Te=!0}return w[r]=ea(t,_e,Ae,e,Se,K,n),new ta(t)}function M(t=Mn()){t=O(t);const e=x(t,F);return e.isInitialized()?e.getImmediate():sa(t)}function sa(t,e={}){const n=x(t,F);if(n.isInitialized()){const a=n.getImmediate();if(P(e,n.getOptions()))return a;throw m.create("already-initialized")}return n.initialize({options:e})}function ia(t,e,n){t=O(t),Jr(R,w[t.app.options.appId],e).catch(r=>u.error(r))}function ct(t,e,n){t=O(t),Xr(R,w[t.app.options.appId],e,n).catch(r=>u.error(r))}function oa(t,e){t=O(t),Zr(w[t.app.options.appId],e).catch(n=>u.error(n))}function ne(t,e,n,r){t=O(t),Yr(R,w[t.app.options.appId],e,n,r).catch(a=>u.error(a))}function ca(t){R?R("consent","update",t):ot(t)}const Ce="@firebase/analytics",De="0.10.21";function la(){S(new I(F,(e,{options:n})=>{const r=e.getProvider("app").getImmediate(),a=e.getProvider("installations-internal").getImmediate();return aa(r,a,n)},"PUBLIC")),S(new I("analytics-internal",t,"PRIVATE")),A(Ce,De),A(Ce,De,"esm2020");function t(e){try{const n=e.getProvider(F).getImmediate();return{logEvent:(r,a,s)=>ne(n,r,a,s),setUserProperties:(r,a)=>ct(n,r,a)}}catch(n){throw m.create("interop-component-reg-failed",{reason:n})}}}la();class Ia extends dt{async getAppInstanceId(){throw this.unimplemented("Not implemented on web.")}async setConsent(e){const n=e.status===ut.Granted?"granted":"denied",r={};switch(e.type){case v.AdPersonalization:r.ad_personalization=n;break;case v.AdStorage:r.ad_storage=n;break;case v.AdUserData:r.ad_user_data=n;break;case v.AnalyticsStorage:r.analytics_storage=n;break;case v.FunctionalityStorage:r.functionality_storage=n;break;case v.PersonalizationStorage:r.personalization_storage=n;break}ca(r)}async setUserId(e){const n=M();ia(n,e.userId)}async setUserProperty(e){const n=M();ct(n,{[e.key]:e.value})}async setCurrentScreen(e){const n=M();ne(n,"screen_view",{firebase_screen:e.screenName||void 0,firebase_screen_class:e.screenClassOverride||void 0})}async logEvent(e){const n=M();ne(n,e.name,e.params)}async logTransaction(e){throw this.unimplemented("Not implemented on web.")}async setSessionTimeoutDuration(e){throw this.unimplemented("Not implemented on web.")}async setEnabled(e){const n=M();oa(n,e.enabled)}async isEnabled(){return{enabled:window["ga-disable-analyticsId"]===!0}}async resetAnalyticsData(){throw this.unimplemented("Not implemented on web.")}async initiateOnDeviceConversionMeasurementWithEmailAddress(e){throw this.unimplemented("Not implemented on web.")}async initiateOnDeviceConversionMeasurementWithPhoneNumber(e){throw this.unimplemented("Not implemented on web.")}async initiateOnDeviceConversionMeasurementWithHashedEmailAddress(e){throw this.unimplemented("Not implemented on web.")}async initiateOnDeviceConversionMeasurementWithHashedPhoneNumber(e){throw this.unimplemented("Not implemented on web.")}}export{Ia as FirebaseAnalyticsWeb};
