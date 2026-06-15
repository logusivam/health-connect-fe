//import React from 'react';

const PageHeader = ({ title, description }: { title: string, description: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    <p className="text-slate-500">{description}</p>
  </div>
);

export default PageHeader;