/**
 * @module Components
 *
 */
import $ from 'jquery';
import { A } from '@ember/array';
import { isNone, isEmpty } from '@ember/utils';
import EmberObject, { get, set, computed } from '@ember/object';
import Component from '@ember/component';
import CloseOnEscape from '../mixins/close-on-escape';
import BindOutsideClick from '../mixins/bind-outside-click';
import layout from '../templates/components/bc-select-menu';

/***/

function forEachOption(data, callback, target=null) {
	if (data.each) {
		data.each((idx, element) => {
			const el = $(element);
			callback.call(target, el, idx);
		});
	}
}

/**
 * `Component/BcSelectMenu`
 *
 * @class BcSelectMenu
 * @namespace Components
 * @extends Ember.Component
 */
export default Component.extend(CloseOnEscape, BindOutsideClick, {
  layout,
	classNames: ['bc-select-menu'],
	classNameBindings: ['right', 'isMenuOpen:open', 'fullwidth', 'large'],

	__closeActionName: 'closeMenu',

	/**
	 * Flag for a larger drop down button
	 *
	 * @public
	 * @property large
	 * @type {boolean}
	 */
	large: false,

	/**
	 * Flag for open and close of the drop down
	 *
	 * @private
	 * @property isMenuOpen
	 * @type {boolean}
	 */
	isMenuOpen: false,

	/**
	 * Sets the class `right` so the dialog is
	 * formatted for the right side of the screen
	 *
	 * @public
	 * @property right
	 * @type {boolean} default: false
	 */
	right: false,

	/**
	 * sets the class fullwidth to force the
	 * select menu to use 100% of its container
	 *
	 * @public
	 * @property fullwidth
	 * @type {boolean}
	 */
	fullwidth: false,

	/**
	 * Forces the drop down to keep the same label
	 * after an option is selected
	 *
	 * @public
	 * @property disableChange
	 * @type {boolean} default: false
	 */
	disableChange: false,

	/**
	 * Forces the drop down to remain open after
	 * an option is selected
	 *
	 * @public
	 * @property keepOpen
	 * @type {boolean} default: false
	 */
	keepOpen: false,

	/**
	 * Default label for an unselected drop down initial state
	 *
	 * If this option is not set then the first item in the options list will
	 * be used.
	 *
	 * @public
	 * @property label
	 * @type {string}
	 * @default null
	 */
	label: null,

	/**
		* action event triggered when a list option is clicked
		*
		* @public
		* @property onSelect
		* @type {event}
		*/
	onSelect: null,

	/**
	 * Array of options after parsed
	 *
	 * @private
	 * @property listItem
	 * @type {object[]}
	 */
	listItem: null,

	/**
	 * The current selected item from the list. This will be null
	 * until an item is first selected.
	 *
	 * @private
	 * @property selected
	 * @type {object}
	 */
	selected: null,

	/**
	 * The text to display in the select menu button
	 *
	 * @private
	 * @property selectedText
	 * @type {string}
	 */
	selectedText: computed('selected', 'label', 'listItem.[]', function() {
		if (!isNone(get(this, 'selected'))) { // look for a selected option first
			return get(this, 'selected.label');
		} else if (!isEmpty(get(this, 'label'))) { // if no selected option then look for a provided label
			return get(this, 'label');
		} else if (!isNone(get(this, 'listItem'))) { // no option or label then set it to the first option label
			return get(this, 'listItem.firstObject.label');
		} else { // otherwise just return an empty string
			return '';
		}
	}),

	/**
	 * Initializes the listItem array
	 *
	 * @private
	 * @method setup
	 * @returns {void}
	 */
	didRender() {
		this._super();

		if (this.$()) {
			// get options list
			const data = this.$('.hidden-template').children();
			if (this.hasChanges(data)) {
				this.createOptionsList(data);
			}
		}
	},

	/**
	 * Override method that gets called to
	 * validate the input and check if this item should
	 * be added to the options list
	 *
	 * @private
	 * @method shouldCreateOption
	 * @param el {object} jquery element object
	 * @returns {boolean}
	 */
	shouldCreateOption(el) {
		// check if the element is set to hidden
		return isNone(el.attr('hidden'));
	},

	/**
	 * Override method for creating a option item
	 * object. for classes that need additional functionality
	 * this can be overridden to create a more advanced object.
	 *
	 * @private
	 * @method createOption
	 * @param el {object} jquery element object
	 * @returns {object}
	 */
	createOption(el) {
		// create the option object
		const opt = EmberObject.create({
			class: el.attr('class'),
			label: el.text(),
			value: el.val(),
			selected: el.is(':selected'),
			disabled: el.is(':disabled')
		});
		return opt;
	},

	/**
	 * Creates a new options item list.
	 *
	 * This method gets called by didRender setup callback each time
	 * the template is rerendered and changes have been detected to
	 * the options item list
	 *
	 * @private
	 * @method createOptionsList
	 * @params data {object} jquery child array from the `hidden-template` container element
	 * @returns {void}
	 */
	createOptionsList(data) {
		// create data array for option data
		const dataArray = A([]);

		// loop through option data
		forEachOption(data, el => {
			// dont add option that are set to hidden
			if (this.shouldCreateOption(el)) {
				// create the option item
				const opt = this.createOption(el);

				if (get(opt, 'selected')) {
					this.setSelected(opt);
				}

				// add option to list
				dataArray.pushObject(opt);
			}
		});

		// set new list items
		set(this, 'listItem', dataArray);
	},

	/**
	 * Checks the array for any addition changes to items in the array.
	 *
	 * returns true if a new item is found or any properties on a
	 * option item have changed
	 *
	 * @private
	 * @method hasChanges
	 * @param data {object} jquery child array from the `hidden-template` container element
	 * @returns {boolean}
	 */
	hasChanges(data) {
		let hasChanges = false;
		forEachOption(data, el => {
			// if no changes detected yet
			if (!hasChanges) {
				// the list is empty so all items have changed
				if (isEmpty(get(this, 'listItem'))) {
					hasChanges = true;
				} else {
					// create option obj from element
					const option = this.createOption(el);

					// dont include default labels in the changes
					if (get(option, 'class') !== 'default-label') {
						// get old option item
						const oldOpt = get(this, 'listItem').findBy('value', get(option, 'value'));

						// item not found in list items
						if (isNone(oldOpt)) {
							hasChanges = true;
						} else {
							// check all keys in old opt for changes
							Object.keys(option).forEach((key) => {
								// item property does not mathc old property
								if (get(oldOpt, key) !== get(option, key)) {
									hasChanges = true;
								}
							});
						}
					}
				}
			}
		});
		return hasChanges;
	},

	/**
	 * Sets the selected option and unsets all other options
	 * in the listItem option array
	 *
	 * @public
	 * @method setSelected
	 * @params option {object} selcted option object
	 * @return {void}
	 */
	setSelected(option) {
		if (!get(this, 'disableChange')) {
			set(this, 'selected', option);
		}
	},

	onOutsideClick() { this.send('closeMenu'); },
	onEscape() {
		this.send('closeMenu');
		return false;
	},

	actions: {
		/**
		 * Toggles the menu open or close
		 *
		 * Action method
		 *
		 * @private
		 * @method toggleMenu
		 * @returns {void}
		 */
		toggleMenu() {
			if (!get(this, 'isMenuOpen')) {
				this.bindEscape();
				this.bindClick();
				set(this, 'isMenuOpen', true);
			} else {
				this.send('closeMenu');
			}
		},

		/**
		 * Closes the menu
		 *
		 * Action method
		 *
		 * @private
		 * @method closeMenu
		 * @returns {void}
		 */
		closeMenu() {
			this.unbindEscape();
			this.unbindClick();
			set(this, 'isMenuOpen', false);
		},

		/**
		 * Sends the onSelect event action
		 *
		 * Action Method
		 *
		 * @private
		 * @method selectAction
		 * @params option {object} An option html object
		 * @returns {void}
		 */
		selectAction(option) {
			// do nothing if disabled is set to
			// true for the item selected
			if (!get(option, 'disabled')) {
				// close menu unless keep open
				// is set to true
				if (!get(this, 'keepOpen')) {
					this.send('closeMenu');
				}

				// send the value of the option to the onSelect callback
				this.sendAction('onSelect', get(option, 'value'));
			}
		},

		stopPropagation() {
			return false;
		}
	}
});
