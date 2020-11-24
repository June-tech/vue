import { initMixin } from './init';
import { stateMixin } from './state';
import { renderMixin } from './render';
import { eventsMixin } from './events';
import { lifecycleMixin } from './lifecycle';
import { warn } from '../util/index';
// 此处不用class 的原因是因为方便后续给vue实例混入实例成员
function Vue (options) {
	if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
		warn('Vue is a constructor and should be called with the `new` keyword');
  }
  // 调用_init()方法
	this._init(options);
}
// 注册vm的init方法，初始化vm
initMixin(Vue);
// 注册vue的data,props,set,delete,watch
stateMixin(Vue);
// 初始化事件方法
// on,once,off,emit
eventsMixin(Vue);
// 初始化生命周期的混入方法
// update,forceUpdate,destroy
lifecycleMixin(Vue);
// 混入render
// nextTick,render
renderMixin(Vue);

export default Vue;
