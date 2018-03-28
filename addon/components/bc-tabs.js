/**
 * @module components
 *
 */
import $ from 'jquery';
import { assert } from '@ember/debug';
import { dasherize } from '@ember/string';
import EmberObject, { get, set } from '@ember/object';
import { isNone, isEmpty } from '@ember/utils';
import Component from '@ember/component';
import layout from '../templates/components/bc-tabs';

/***/
const TAB_CONTENT = '.--bc-tabs-content';

/**
 * `Component/BCTabs`
 *
 * @class BCTabs Component
 * @extends Ember.Component
 */
export default Component.extend({
	layout: layout,

	classNames: ['--bc-tabs'],

	/**
	 * variable for tracking tabNames, is an array
	 *
	 * @property model
	 * @type object[]
	 */
	model: null,

	defaultTab: '',
	currentTab: '',
	hashName: '',

	firstRender: false,

	init() {
		this._super();
		this.handleHash();
	},

	didRender() {
		this._super();
		if (!get(this, 'firstRender')) {
			set(this, 'firstRender', true);

			let model = this.buildTabData();
			if (!isEmpty(model)) {
				let activeTab;
				if (!isEmpty(get(this, 'defaultTab'))) {
					activeTab = model.findBy('id', get(this, 'defaultTab'));
				} else if (!isEmpty(get(this, 'hashName'))) {
					activeTab = model.findBy('id', get(this, 'hashName'));
				}

				if (isNone(activeTab)) {
					activeTab = model[0];
					set(this, 'defaultTab', get(activeTab, 'id'));
				}

				this.openTab(activeTab);
			}
		}
	},

	buildTabData() {
		assert('buildTabData must be called after render', this.$().length > 0);

		let model = [];
		this.$(TAB_CONTENT).children().each((index, el) => {
			let elData = $(el).data();
			let data = EmberObject.create({
				el, id: elData.id,
				active: false,
				tabName: elData.tabName,
				tabIndex: elData.tabIndex,
				isViewable: elData.isViewable,
				showBadge: elData.showBadge,
				badgeContent: elData.badgeContent,
				badgeColor: elData.badgeColor,
				showTab() {
					set(this, 'active', true);
					elData.showTab();
				},
				hideTab() {
					set(this, 'active', false);
					elData.hideTab();
				},
				on: elData.on,
			});

			// register for child events
			data.on('change', () => {
				window.console.log('child change', get(data, 'id'));
				this.buildTabData();
			});

			model.push(data);
		});

		if (get(model, 'length') > 0) {
			// sort models by tabIndex
			model = model.sortBy('tabIndex');
		}

		set(this, 'model', model);
		return model;
	},

	handleHash() {
		const hash = window.location.hash;
		if (!isEmpty(hash) && hash.match(/^#tab-/)) {
			set(this, 'hashName', dasherize(hash.replace(/^#tab-/, '').trim()));
		}
	},

	openTab(tab) {
		if (this.$().length > 0) {
			// hide all other tabs
			get(this, 'model').forEach(item => item.hideTab());

			// show the new tab
			tab.showTab();

			// set the history hash, except pages with queries
			if (get(tab, 'id') !== get(this, 'currentTab.id') && get(tab, 'id') !== get(this, 'defaultTab') && isEmpty(window.location.search)) {
				set(this, 'hashName', get(tab, 'id'));
				window.history.replaceState('', document.title, `${window.location.pathname}#tab-${get(tab, 'id')}`);
			}

			set(this, 'currentTab', tab);
		}
	},

	actions: {
		changeTab(tab) {
			this.openTab(tab);
		}
	}
});
