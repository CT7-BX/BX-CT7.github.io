/* BX-HEN Core 0.2: ES5-compatible browser module and diagnostics runtime.
 * This is NOT a kernel HEN, jailbreak, or payload executor. */
(function (global) {
  'use strict';
  var VERSION = '0.2.0', modules = [], listeners = {}, history = [], settings = {};
  var started = false, busy = false, MAX_HISTORY = 100;
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function record(type, detail) {
    var event = {type:type,detail:detail,timestamp:new Date().toISOString()};
    history.push(event);if(history.length>MAX_HISTORY)history.shift();return event;
  }
  function emit(type,detail){
    var event=record(type,detail), list=(listeners[type]||[]).slice(),i;
    for(i=0;i<list.length;i++){try{list[i](event);}catch(error){record('listener:error',String(error));}}
    return event;
  }
  function on(type,callback){
    if(typeof type!=='string'||!type||typeof callback!=='function')throw new TypeError('Invalid listener');
    if(!own(listeners,type))listeners[type]=[];
    listeners[type].push(callback);
    return function(){var a=listeners[type]||[],i=a.indexOf(callback);if(i!==-1)a.splice(i,1);};
  }
  function register(name,module){
    var i;
    if(started||busy)throw new Error('Register modules before start()');
    if(typeof name!=='string'||!name||!module||typeof module.start!=='function')throw new Error('Invalid module');
    for(i=0;i<modules.length;i++)if(modules[i].name===name)throw new Error('Invalid or duplicate module');
    modules.push({name:name,instance:module,state:'registered'});
  }
  function promiseResolve(value){return Promise.resolve(value);}
  function start(){
    if(started||busy)return promiseResolve();
    started=true;busy=true;
    var chain=promiseResolve();
    modules.forEach(function(entry){
      chain=chain.then(function(){
        return promiseResolve().then(function(){return entry.instance.start(Object.freeze({emit:emit,on:on,getSetting:getSetting}));})
          .then(function(){entry.state='running';emit('module:started',{name:entry.name});},
                function(error){entry.state='failed';emit('module:error',{name:entry.name,message:String(error)});});
      });
    });
    return chain.then(function(){busy=false;emit('core:ready',{version:VERSION});},
      function(error){busy=false;emit('core:error',String(error));});
  }
  function stop(){
    if(!started||busy)return promiseResolve();
    busy=true;
    var chain=promiseResolve();
    modules.slice().reverse().forEach(function(entry){
      chain=chain.then(function(){
        if(entry.state!=='running')return;
        return promiseResolve().then(function(){if(typeof entry.instance.stop==='function')return entry.instance.stop();})
          .then(function(){entry.state='stopped';},
                function(error){entry.state='failed';emit('module:error',{name:entry.name,message:String(error)});});
      });
    });
    return chain.then(function(){started=false;busy=false;emit('core:stopped',{});},
      function(error){busy=false;emit('core:error',String(error));});
  }
  function getSetting(key){return own(settings,key)?settings[key]:undefined;}
  function setSetting(key,value){
    if(typeof key!=='string'||!key)throw new TypeError('Setting key must be a nonempty string');
    settings[key]=value;emit('setting:changed',{key:key});
  }
  function diagnostics(){
    return {version:VERSION,started:started,browser:typeof navigator!=='undefined'?navigator.userAgent:'unknown',
      secureContext:typeof global.isSecureContext==='boolean'?global.isSecureContext:null,
      modules:modules.map(function(e){return {name:e.name,state:e.state};}),events:history.slice()};
  }
  Object.defineProperty(global,'BXHENCore',{value:Object.freeze({version:VERSION,on:on,emit:emit,register:register,
    start:start,stop:stop,getSetting:getSetting,setSetting:setSetting,diagnostics:diagnostics}),
    writable:false,configurable:false});
})(typeof window!=='undefined'?window:this);
