# UmbNumericDropdown

This package was designed with a particular use case in mind - make it more comfortable for editors to directly affect frontend styling via the backoffice property editors, without being overloaded with a ton of properties.
For example, this editor can be used to easily set up a block with configurable width that can be set in pixels, vw, em, %, or other units, without setting up too many properties.

Since the dropdown values are configurable, it can also be used to e.g. measure weight, distance, height or other units.

Usage in Razor views:
```c#
@using UmbNumericDropdown
...
@{
    NumericDropdownValue? weight = Model.Value<NumericDropdownValue>("weight");
    //IsComplete method returns true if the model contains both values
    if (weight != null && weight.IsComplete)
    {
        <p>Weight: @weight.FormattedValue</p>
        
        // you can also access individual parts - Number is the numeric value, SelectedOption is the dropdown value
        <p>Number: @weight.Number</p>
        <p>Unit: @weight.SelectedOption</p>
    }
}
```

## Configuration/customization

Available configuration options:
- Numeric - Minimum value (integer)
- Numeric - Maximum value (integer)
- Dropdown - Options (strings)

## Tips

In the editor UI, the property editor's dropdown will always auto-select the first option in the dropdown if no specific value is set (as opposed to Umbraco's native dropdown implementation).

Any validation errors, like a number that is out of configured bounds, will not prevent the document from saving/publishing, but the UI editor will be highlighted with a warning and the picked value will not be updated.