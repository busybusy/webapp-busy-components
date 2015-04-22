/**
 * @module component
 *
 */
import Ember from 'ember';

/**
 * `Torpid/ListHeader`
 *
 */
export default Ember.Component.extend(
{
	tagName: 'header',

	classNames: ['torpid-list-header'],

	classNameBindings: ['selector', 'edit', 'hasImage:image'],

	selector: false,
	edit: false,
	hasImage: false,

	actions: {
		addAction: function()
		{
			this.sendAction('onAdd');
		}
	}

});
