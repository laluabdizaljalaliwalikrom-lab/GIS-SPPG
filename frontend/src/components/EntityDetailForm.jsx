import SPPGUnitForm from './SPPGUnitForm';
import KelompokForm from './KelompokForm';

const EntityDetailForm = ({ type, initialData, onSubmit, formId }) => {
  if (type === 'sppg') {
    return (
      <SPPGUnitForm 
        formId={formId}
        initialData={initialData} 
        onSubmit={onSubmit} 
      />
    );
  }

  if (type === 'kelompok') {
    return (
      <KelompokForm 
        formId={formId}
        initialData={initialData} 
        onSubmit={onSubmit} 
      />
    );
  }

  return <div className="p-8 text-center text-slate-400 font-bold italic">Entity type not supported</div>;
};

export default EntityDetailForm;
