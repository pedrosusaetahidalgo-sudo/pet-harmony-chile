import{r as T,d as A,C as v,c as C,E as W,F as Y,o as Ae,L as ve,f as b,g as Se,h as ke,j as J,k as X,l as Q,v as Z,m as q}from"./index.esm-DaYI8HwS.js";const ee="@firebase/installations",$="0.6.21";/**
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
 */const te=1e4,ne=`w:${$}`,ae="FIS_v2",Ce="https://firebaseinstallations.googleapis.com/v1",Ee=60*60*1e3,Re="installations",Pe="Installations";/**
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
 */const _e={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},w=new W(Re,Pe,_e);function ie(e){return e instanceof Y&&e.code.includes("request-failed")}/**
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
 */function se({projectId:e}){return`${Ce}/projects/${e}/installations`}function re(e){return{token:e.token,requestStatus:2,expiresIn:Fe(e.expiresIn),creationTime:Date.now()}}async function oe(e,t){const a=(await t.json()).error;return w.create("request-failed",{requestName:e,serverCode:a.code,serverMessage:a.message,serverStatus:a.status})}function ce({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function De(e,{refreshToken:t}){const n=ce(e);return n.append("Authorization",Oe(t)),n}async function le(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Fe(e){return Number(e.replace("s","000"))}function Oe(e){return`${ae} ${e}`}/**
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
 */async function $e({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const a=se(e),i=ce(e),s=t.getImmediate({optional:!0});if(s){const l=await s.getHeartbeatsHeader();l&&i.append("x-firebase-client",l)}const r={fid:n,authVersion:ae,appId:e.appId,sdkVersion:ne},o={method:"POST",headers:i,body:JSON.stringify(r)},c=await le(()=>fetch(a,o));if(c.ok){const l=await c.json();return{fid:l.fid||n,registrationStatus:2,refreshToken:l.refreshToken,authToken:re(l.authToken)}}else throw await oe("Create Installation",c)}/**
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
 */function ue(e){return new Promise(t=>{setTimeout(t,e)})}/**
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
 */function Me(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const Ne=/^[cdef][\w-]{21}$/,F="";function xe(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Le(e);return Ne.test(n)?n:F}catch{return F}}function Le(e){return Me(e).substr(0,22)}/**
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
 */function E(e){return`${e.appName}!${e.appId}`}/**
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
 */const de=new Map;function fe(e,t){const n=E(e);pe(n,t),qe(n,t)}function pe(e,t){const n=de.get(e);if(n)for(const a of n)a(t)}function qe(e,t){const n=je();n&&n.postMessage({key:e,fid:t}),Ue()}let m=null;function je(){return!m&&"BroadcastChannel"in self&&(m=new BroadcastChannel("[Firebase] FID Change"),m.onmessage=e=>{pe(e.data.key,e.data.fid)}),m}function Ue(){de.size===0&&m&&(m.close(),m=null)}/**
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
 */const Be="firebase-installations-database",Ve=1,I="firebase-installations-store";let P=null;function M(){return P||(P=Ae(Be,Ve,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(I)}}})),P}async function S(e,t){const n=E(e),i=(await M()).transaction(I,"readwrite"),s=i.objectStore(I),r=await s.get(n);return await s.put(t,n),await i.done,(!r||r.fid!==t.fid)&&fe(e,t.fid),t}async function he(e){const t=E(e),a=(await M()).transaction(I,"readwrite");await a.objectStore(I).delete(t),await a.done}async function R(e,t){const n=E(e),i=(await M()).transaction(I,"readwrite"),s=i.objectStore(I),r=await s.get(n),o=t(r);return o===void 0?await s.delete(n):await s.put(o,n),await i.done,o&&(!r||r.fid!==o.fid)&&fe(e,o.fid),o}/**
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
 */async function N(e){let t;const n=await R(e.appConfig,a=>{const i=ze(a),s=Ge(e,i);return t=s.registrationPromise,s.installationEntry});return n.fid===F?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function ze(e){const t=e||{fid:xe(),registrationStatus:0};return ge(t)}function Ge(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(w.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},a=He(e,n);return{installationEntry:n,registrationPromise:a}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Ke(e)}:{installationEntry:t}}async function He(e,t){try{const n=await $e(e,t);return S(e.appConfig,n)}catch(n){throw ie(n)&&n.customData.serverCode===409?await he(e.appConfig):await S(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Ke(e){let t=await j(e.appConfig);for(;t.registrationStatus===1;)await ue(100),t=await j(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:a}=await N(e);return a||n}return t}function j(e){return R(e,t=>{if(!t)throw w.create("installation-not-found");return ge(t)})}function ge(e){return We(e)?{fid:e.fid,registrationStatus:0}:e}function We(e){return e.registrationStatus===1&&e.registrationTime+te<Date.now()}/**
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
 */async function Ye({appConfig:e,heartbeatServiceProvider:t},n){const a=Je(e,n),i=De(e,n),s=t.getImmediate({optional:!0});if(s){const l=await s.getHeartbeatsHeader();l&&i.append("x-firebase-client",l)}const r={installation:{sdkVersion:ne,appId:e.appId}},o={method:"POST",headers:i,body:JSON.stringify(r)},c=await le(()=>fetch(a,o));if(c.ok){const l=await c.json();return re(l)}else throw await oe("Generate Auth Token",c)}function Je(e,{fid:t}){return`${se(e)}/${t}/authTokens:generate`}/**
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
 */async function x(e,t=!1){let n;const a=await R(e.appConfig,s=>{if(!me(s))throw w.create("not-registered");const r=s.authToken;if(!t&&Ze(r))return s;if(r.requestStatus===1)return n=Xe(e,t),s;{if(!navigator.onLine)throw w.create("app-offline");const o=tt(s);return n=Qe(e,o),o}});return n?await n:a.authToken}async function Xe(e,t){let n=await U(e.appConfig);for(;n.authToken.requestStatus===1;)await ue(100),n=await U(e.appConfig);const a=n.authToken;return a.requestStatus===0?x(e,t):a}function U(e){return R(e,t=>{if(!me(t))throw w.create("not-registered");const n=t.authToken;return nt(n)?{...t,authToken:{requestStatus:0}}:t})}async function Qe(e,t){try{const n=await Ye(e,t),a={...t,authToken:n};return await S(e.appConfig,a),n}catch(n){if(ie(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await he(e.appConfig);else{const a={...t,authToken:{requestStatus:0}};await S(e.appConfig,a)}throw n}}function me(e){return e!==void 0&&e.registrationStatus===2}function Ze(e){return e.requestStatus===2&&!et(e)}function et(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+Ee}function tt(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function nt(e){return e.requestStatus===1&&e.requestTime+te<Date.now()}/**
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
 */async function at(e){const t=e,{installationEntry:n,registrationPromise:a}=await N(t);return a?a.catch(console.error):x(t).catch(console.error),n.fid}/**
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
 */async function it(e,t=!1){const n=e;return await st(n),(await x(n,t)).token}async function st(e){const{registrationPromise:t}=await N(e);t&&await t}/**
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
 */function rt(e){if(!e||!e.options)throw _("App Configuration");if(!e.name)throw _("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw _(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function _(e){return w.create("missing-app-config-values",{valueName:e})}/**
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
 */const we="installations",ot="installations-internal",ct=e=>{const t=e.getProvider("app").getImmediate(),n=rt(t),a=C(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:a,_delete:()=>Promise.resolve()}},lt=e=>{const t=e.getProvider("app").getImmediate(),n=C(t,we).getImmediate();return{getId:()=>at(n),getToken:i=>it(n,i)}};function ut(){A(new v(we,ct,"PUBLIC")),A(new v(ot,lt,"PRIVATE"))}ut();T(ee,$);T(ee,$,"esm2020");/**
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
 */const k="analytics",dt="firebase_id",ft="origin",pt=60*1e3,ht="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig",L="https://www.googletagmanager.com/gtag/js";/**
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
 */const u=new ve("@firebase/analytics");/**
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
 */const gt={"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."},d=new W("analytics","Analytics",gt);/**
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
 */function mt(e){if(!e.startsWith(L)){const t=d.create("invalid-gtag-resource",{gtagURL:e});return u.warn(t.message),""}return e}function Ie(e){return Promise.all(e.map(t=>t.catch(n=>n)))}function wt(e,t){let n;return window.trustedTypes&&(n=window.trustedTypes.createPolicy(e,t)),n}function It(e,t){const n=wt("firebase-js-sdk-policy",{createScriptURL:mt}),a=document.createElement("script"),i=`${L}?l=${e}&id=${t}`;a.src=n?n==null?void 0:n.createScriptURL(i):i,a.async=!0,document.head.appendChild(a)}function yt(e){let t=[];return Array.isArray(window[e])?t=window[e]:window[e]=t,t}async function bt(e,t,n,a,i,s){const r=a[i];try{if(r)await t[r];else{const c=(await Ie(n)).find(l=>l.measurementId===i);c&&await t[c.appId]}}catch(o){u.error(o)}e("config",i,s)}async function Tt(e,t,n,a,i){try{let s=[];if(i&&i.send_to){let r=i.send_to;Array.isArray(r)||(r=[r]);const o=await Ie(n);for(const c of r){const l=o.find(p=>p.measurementId===c),f=l&&t[l.appId];if(f)s.push(f);else{s=[];break}}}s.length===0&&(s=Object.values(t)),await Promise.all(s),e("event",a,i||{})}catch(s){u.error(s)}}function At(e,t,n,a){async function i(s,...r){try{if(s==="event"){const[o,c]=r;await Tt(e,t,n,o,c)}else if(s==="config"){const[o,c]=r;await bt(e,t,n,a,o,c)}else if(s==="consent"){const[o,c]=r;e("consent",o,c)}else if(s==="get"){const[o,c,l]=r;e("get",o,c,l)}else if(s==="set"){const[o]=r;e("set",o)}else e(s,...r)}catch(o){u.error(o)}}return i}function vt(e,t,n,a,i){let s=function(...r){window[a].push(arguments)};return window[i]&&typeof window[i]=="function"&&(s=window[i]),window[i]=At(s,e,t,n),{gtagCore:s,wrappedGtag:window[i]}}function St(e){const t=window.document.getElementsByTagName("script");for(const n of Object.values(t))if(n.src&&n.src.includes(L)&&n.src.includes(e))return n;return null}/**
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
 */const kt=30,Ct=1e3;class Et{constructor(t={},n=Ct){this.throttleMetadata=t,this.intervalMillis=n}getThrottleMetadata(t){return this.throttleMetadata[t]}setThrottleMetadata(t,n){this.throttleMetadata[t]=n}deleteThrottleMetadata(t){delete this.throttleMetadata[t]}}const ye=new Et;function Rt(e){return new Headers({Accept:"application/json","x-goog-api-key":e})}async function Pt(e){var r;const{appId:t,apiKey:n}=e,a={method:"GET",headers:Rt(n)},i=ht.replace("{app-id}",t),s=await fetch(i,a);if(s.status!==200&&s.status!==304){let o="";try{const c=await s.json();(r=c.error)!=null&&r.message&&(o=c.error.message)}catch{}throw d.create("config-fetch-failed",{httpStatus:s.status,responseMessage:o})}return s.json()}async function _t(e,t=ye,n){const{appId:a,apiKey:i,measurementId:s}=e.options;if(!a)throw d.create("no-app-id");if(!i){if(s)return{measurementId:s,appId:a};throw d.create("no-api-key")}const r=t.getThrottleMetadata(a)||{backoffCount:0,throttleEndTimeMillis:Date.now()},o=new Ot;return setTimeout(async()=>{o.abort()},pt),be({appId:a,apiKey:i,measurementId:s},r,o,t)}async function be(e,{throttleEndTimeMillis:t,backoffCount:n},a,i=ye){var o;const{appId:s,measurementId:r}=e;try{await Dt(a,t)}catch(c){if(r)return u.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${r} provided in the "measurementId" field in the local Firebase config. [${c==null?void 0:c.message}]`),{appId:s,measurementId:r};throw c}try{const c=await Pt(e);return i.deleteThrottleMetadata(s),c}catch(c){const l=c;if(!Ft(l)){if(i.deleteThrottleMetadata(s),r)return u.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${r} provided in the "measurementId" field in the local Firebase config. [${l==null?void 0:l.message}]`),{appId:s,measurementId:r};throw c}const f=Number((o=l==null?void 0:l.customData)==null?void 0:o.httpStatus)===503?q(n,i.intervalMillis,kt):q(n,i.intervalMillis),p={throttleEndTimeMillis:Date.now()+f,backoffCount:n+1};return i.setThrottleMetadata(s,p),u.debug(`Calling attemptFetch again in ${f} millis`),be(e,p,a,i)}}function Dt(e,t){return new Promise((n,a)=>{const i=Math.max(t-Date.now(),0),s=setTimeout(n,i);e.addEventListener(()=>{clearTimeout(s),a(d.create("fetch-throttle",{throttleEndTimeMillis:t}))})})}function Ft(e){if(!(e instanceof Y)||!e.customData)return!1;const t=Number(e.customData.httpStatus);return t===429||t===500||t===503||t===504}class Ot{constructor(){this.listeners=[]}addEventListener(t){this.listeners.push(t)}abort(){this.listeners.forEach(t=>t())}}async function $t(e,t,n,a,i){if(i&&i.global){e("event",n,a);return}else{const s=await t,r={...a,send_to:s};e("event",n,r)}}async function Mt(e,t,n,a){{const i=await t;e("config",i,{update:!0,user_id:n})}}async function Nt(e,t,n,a){if(a&&a.global){const i={};for(const s of Object.keys(n))i[`user_properties.${s}`]=n[s];return e("set",i),Promise.resolve()}else{const i=await t;e("config",i,{update:!0,user_properties:n})}}async function xt(e,t){const n=await e;window[`ga-disable-${n}`]=!t}let O;function Te(e){O=e}/**
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
 */async function Lt(){if(Q())try{await Z()}catch(e){return u.warn(d.create("indexeddb-unavailable",{errorInfo:e==null?void 0:e.toString()}).message),!1}else return u.warn(d.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;return!0}async function qt(e,t,n,a,i,s,r){const o=_t(e);o.then(h=>{n[h.measurementId]=h.appId,e.options.measurementId&&h.measurementId!==e.options.measurementId&&u.warn(`The measurement ID in the local Firebase config (${e.options.measurementId}) does not match the measurement ID fetched from the server (${h.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)}).catch(h=>u.error(h)),t.push(o);const c=Lt().then(h=>{if(h)return a.getId()}),[l,f]=await Promise.all([o,c]);St(s)||It(s,l.measurementId),O&&(i("consent","default",O),Te(void 0)),i("js",new Date);const p=(r==null?void 0:r.config)??{};return p[ft]="firebase",p.update=!0,f!=null&&(p[dt]=f),i("config",l.measurementId,p),l.measurementId}/**
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
 */class jt{constructor(t){this.app=t}_delete(){return delete g[this.app.options.appId],Promise.resolve()}}let g={},B=[];const V={};let D="dataLayer",Ut="gtag",z,y,G=!1;function Bt(){const e=[];if(J()&&e.push("This is a browser extension environment."),X()||e.push("Cookies are not available."),e.length>0){const t=e.map((a,i)=>`(${i+1}) ${a}`).join(" "),n=d.create("invalid-analytics-context",{errorInfo:t});u.warn(n.message)}}function Vt(e,t,n){Bt();const a=e.options.appId;if(!a)throw d.create("no-app-id");if(!e.options.apiKey)if(e.options.measurementId)u.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);else throw d.create("no-api-key");if(g[a]!=null)throw d.create("already-exists",{id:a});if(!G){yt(D);const{wrappedGtag:s,gtagCore:r}=vt(g,B,V,D,Ut);y=s,z=r,G=!0}return g[a]=qt(e,B,V,t,z,D,n),new jt(e)}function Yt(e=Se()){e=b(e);const t=C(e,k);return t.isInitialized()?t.getImmediate():zt(e)}function zt(e,t={}){const n=C(e,k);if(n.isInitialized()){const i=n.getImmediate();if(ke(t,n.getOptions()))return i;throw d.create("already-initialized")}return n.initialize({options:t})}async function Jt(){if(J()||!X()||!Q())return!1;try{return await Z()}catch{return!1}}function Xt(e,t,n){e=b(e),Mt(y,g[e.app.options.appId],t).catch(a=>u.error(a))}function Gt(e,t,n){e=b(e),Nt(y,g[e.app.options.appId],t,n).catch(a=>u.error(a))}function Qt(e,t){e=b(e),xt(g[e.app.options.appId],t).catch(n=>u.error(n))}function Ht(e,t,n,a){e=b(e),$t(y,g[e.app.options.appId],t,n,a).catch(i=>u.error(i))}function Zt(e){y?y("consent","update",e):Te(e)}const H="@firebase/analytics",K="0.10.21";function Kt(){A(new v(k,(t,{options:n})=>{const a=t.getProvider("app").getImmediate(),i=t.getProvider("installations-internal").getImmediate();return Vt(a,i,n)},"PUBLIC")),A(new v("analytics-internal",e,"PRIVATE")),T(H,K),T(H,K,"esm2020");function e(t){try{const n=t.getProvider(k).getImmediate();return{logEvent:(a,i,s)=>Ht(n,a,i,s),setUserProperties:(a,i)=>Gt(n,a,i)}}catch(n){throw d.create("interop-component-reg-failed",{reason:n})}}}Kt();export{Yt as getAnalytics,zt as initializeAnalytics,Jt as isSupported,Ht as logEvent,Qt as setAnalyticsCollectionEnabled,Zt as setConsent,Xt as setUserId,Gt as setUserProperties};
