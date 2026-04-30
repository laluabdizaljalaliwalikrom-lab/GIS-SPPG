import { useState, useEffect } from 'react';
import api from '../api';

const SPPGForm = ({ clickedLocation, onSuccess }) => {
  const [formData, setFormData] = useState({
    kode_sppg: '',
    nama: '',
    alamat_desa: '',
    status_operasional: 'Aktif',
    tanggal_operasional: '',
    nama_kepala: '-',
    pengawas_keuangan: '-',
    pengawas_gizi: '-',
    pic_yayasan: '-',
    nama_yayasan: '-',
    kapasitas_produksi: 0,
    lat: '',
    lng: ''
  });

  useEffect(() => {
    if (clickedLocation) {
      const updateLocation = async () => {
        setFormData(prev => ({ ...prev, lat: clickedLocation.lat, lng: clickedLocation.lng }));
      };
      updateLocation();
    }
  }, [clickedLocation]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sppg', formData);
      alert('SPPG created successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to create SPPG');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label>Kode SPPG</label>
        <input name="kode_sppg" value={formData.kode_sppg} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Nama SPPG</label>
        <input name="nama" value={formData.nama} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Alamat Desa</label>
        <input name="alamat_desa" value={formData.alamat_desa} onChange={handleChange} required />
      </div>
      <div className="flex-row">
        <div className="form-group flex-1">
          <label>Latitude</label>
          <input name="lat" value={formData.lat} readOnly placeholder="Click on map" required />
        </div>
        <div className="form-group flex-1">
          <label>Longitude</label>
          <input name="lng" value={formData.lng} readOnly placeholder="Click on map" required />
        </div>
      </div>
      <div className="form-group">
        <label>Status Operasional</label>
        <select name="status_operasional" value={formData.status_operasional} onChange={handleChange}>
          <option value="Aktif">Aktif</option>
          <option value="Non-Aktif">Non-Aktif</option>
        </select>
      </div>
      <div className="form-group">
        <label>Tanggal Operasional</label>
        <input type="date" name="tanggal_operasional" value={formData.tanggal_operasional} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Kapasitas Produksi (Porsi)</label>
        <input type="number" name="kapasitas_produksi" value={formData.kapasitas_produksi} onChange={handleChange} required />
      </div>
      <button type="submit" className="btn">Save SPPG</button>
    </form>
  );
};

export default SPPGForm;
