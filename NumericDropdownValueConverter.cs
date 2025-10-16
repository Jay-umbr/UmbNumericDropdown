using System.Text.Json;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;

namespace UmbNumericDropdown
{
    public class NumericDropdownValueConverter : PropertyValueConverterBase
    {
        public override bool IsConverter(IPublishedPropertyType propertyType)
        {
            return propertyType.EditorUiAlias.Equals("UmbNumericDropdown");
        }

        public override Type GetPropertyValueType(IPublishedPropertyType propertyType)
        {
            return typeof(NumericDropdownValue);
        }

        public override PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType)
        {
            return PropertyCacheLevel.Element;
        }

        public override object? ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, object? source, bool preview)
        {
            if (source == null)
            {
                return null;
            }

            string sourceString = source.ToString() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(sourceString))
            {
                return null;
            }

            return sourceString;
        }

        public override object? ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object? inter, bool preview)
        {
            if (inter == null)
            {
                return null;
            }

            string json = inter.ToString() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(json))
            {
                return null;
            }

            try
            {
                NumericDropdownDto? dto = JsonSerializer.Deserialize<NumericDropdownDto>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (dto == null)
                {
                    return null;
                }

                return new NumericDropdownValue(dto.Number, dto.SelectedOption);
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>
        /// Internal DTO for JSON deserialization
        /// </summary>
        private class NumericDropdownDto
        {
            public int? Number { get; set; }
            public string? SelectedOption { get; set; }
        }
    }

    /// <summary>
    /// Strongly-typed value object for the Numeric with Dropdown property
    /// </summary>
    public class NumericDropdownValue
    {
        public int? Number { get; }
        public string SelectedOption { get; }

        public NumericDropdownValue(int? number, string? selectedOption)
        {
            Number = number;
            SelectedOption = selectedOption ?? string.Empty;
        }

        /// <summary>
        /// Returns true if the numeric value has been set
        /// </summary>
        public bool HasNumber => Number.HasValue;

        /// <summary>
        /// Returns true if an option has been selected
        /// </summary>
        public bool HasOption => !string.IsNullOrEmpty(SelectedOption);

        /// <summary>
        /// Returns true if both number and option are set
        /// </summary>
        public bool IsComplete => HasNumber && HasOption;

        /// <summary>
        /// Returns a formatted string combining the number and option (e.g., "100 kg")
        /// </summary>
        public string FormattedValue => HasNumber && HasOption
            ? $"{Number} {SelectedOption}"
            : string.Empty;

        /// <summary>
        /// Returns the formatted value, or a fallback if not complete
        /// </summary>
        public string FormattedValueOrDefault(string defaultValue = "")
        {
            return IsComplete ? FormattedValue : defaultValue;
        }

        public override string ToString()
        {
            return FormattedValue;
        }
    }
}