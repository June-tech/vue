/* @flow */

import config from '../config';
import { initProxy } from './proxy';
import { initState } from './state';
import { initRender } from './render';
import { initEvents } from './events';
import { mark, measure } from '../util/perf';
import { initLifecycle, callHook } from './lifecycle';
import { initProvide, initInjections } from './inject';
import { extend, mergeOptions, formatComponentName } from '../util/index';

let uid = 0;

export function initMixin (Vue: Class<Component>) {
	// 给vue实例增加init方法
	// 合并options,初始化操作
	Vue.prototype._init = function (options?: Object) {
		const vm: Component = this;
		// a uid
		vm._uid = uid++;
		let startTag, endTag;
		/* istanbul ignore if */
		// 开发环境性能监测
		if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
			startTag = `vue-perf-start:${vm._uid}`;
			endTag = `vue-perf-end:${vm._uid}`;
			mark(startTag);
		}
		// a flag to avoid this being observed
		// 如果是vue实例不需要被observe
		vm._isVue = true;
		// merge options
		// 合并options
		if (options && options._isComponent) {
			// optimize internal component instantiation
			// since dynamic options merging is pretty slow, and none of the
			// internal component options needs special treatment.
			initInternalComponent(vm, options);
		} else {
			vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
		}
		/* istanbul ignore else */
		// 设置渲染的代理对象
		if (process.env.NODE_ENV !== 'production') {
			initProxy(vm);
		} else {
			vm._renderProxy = vm;
		}
		// expose real self
		vm._self = vm;
		// vm生命周期相关变量的初始化
		initLifecycle(vm);
		// vm事件监听的初始化,父组件绑定在当前组件上的事
		initEvents(vm);
    // vm编译render初始化
    // $slots
		initRender(vm);
		// beforeCreate生命周期钩子回调
		callHook(vm, 'beforeCreate');
		// 把inject的成员注入到vm上
		initInjections(vm); // resolve injections before data/props
		// 初始化props,methods,data,computed,watch
    initState(vm);
    // 初始化provide
    initProvide(vm); // resolve provide after data/props
    // created生命周期回调钩子
		callHook(vm, 'created');
		/* istanbul ignore if */
		if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
			vm._name = formatComponentName(vm, false);
			mark(endTag);
			measure(`vue ${vm._name} init`, startTag, endTag);
		}
    // 调用$mount挂载
		if (vm.$options.el) {
			vm.$mount(vm.$options.el);
		}
	};
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
	const opts = (vm.$options = Object.create(vm.constructor.options));
	// doing this because it's faster than dynamic enumeration.
	const parentVnode = options._parentVnode;
	opts.parent = options.parent;
	opts._parentVnode = parentVnode;

	const vnodeComponentOptions = parentVnode.componentOptions;
	opts.propsData = vnodeComponentOptions.propsData;
	opts._parentListeners = vnodeComponentOptions.listeners;
	opts._renderChildren = vnodeComponentOptions.children;
	opts._componentTag = vnodeComponentOptions.tag;

	if (options.render) {
		opts.render = options.render;
		opts.staticRenderFns = options.staticRenderFns;
	}
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
	let options = Ctor.options;
	if (Ctor.super) {
		const superOptions = resolveConstructorOptions(Ctor.super);
		const cachedSuperOptions = Ctor.superOptions;
		if (superOptions !== cachedSuperOptions) {
			// super option changed,
			// need to resolve new options.
			Ctor.superOptions = superOptions;
			// check if there are any late-modified/attached options (#4976)
			const modifiedOptions = resolveModifiedOptions(Ctor);
			// update base extend options
			if (modifiedOptions) {
				extend(Ctor.extendOptions, modifiedOptions);
			}
			options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
			if (options.name) {
				options.components[options.name] = Ctor;
			}
		}
	}
	return options;
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
	let modified;
	const latest = Ctor.options;
	const sealed = Ctor.sealedOptions;
	for (const key in latest) {
		if (latest[key] !== sealed[key]) {
			if (!modified) modified = {};
			modified[key] = latest[key];
		}
	}
	return modified;
}
