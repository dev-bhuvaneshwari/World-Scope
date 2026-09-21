import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, uppercase: true },
  name: { type: String, required: true, index: true },
  officialName: { type: String },
  capital: [String],
  region: { type: String, index: true },
  subregion: { type: String },
  population: { type: Number },
  area: { type: Number },
  languages: { type: Map, of: String },
  currencies: { type: Map, of: Object },
  timezones: [String],
  flag: { type: String },
  flagSvg: { type: String },
  coatOfArms: { type: String },
  latlng: [Number],
  borders: [String],
  independent: { type: Boolean },
  unMember: { type: Boolean },
  continents: [String],
  maps: { type: Object },
  gini: { type: Map, of: Number },
  demonyms: { type: Object },
  // World Bank indicators
  indicators: {
    gdp: { value: Number, year: Number },
    gdpPerCapita: { value: Number, year: Number },
    gdpGrowth: { value: Number, year: Number },
    internetUsers: { value: Number, year: Number },
    lifeExpectancy: { value: Number, year: Number },
    literacy: { value: Number, year: Number },
    unemployment: { value: Number, year: Number },
    co2Emissions: { value: Number, year: Number },
    rdExpenditure: { value: Number, year: Number },
  },
  indicatorsUpdatedAt: { type: Date },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

countrySchema.index({ name: 'text', officialName: 'text' });

export default mongoose.model('Country', countrySchema);
