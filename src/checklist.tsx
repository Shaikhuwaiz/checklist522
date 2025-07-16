
import jsPDF from "jspdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useMemo, useEffect, useState } from "react";

const Stars = () => {
  const [pageHeight, setPageHeight] = useState(0);

  useEffect(() => {
    // Set the total document height once on mount
    setPageHeight(document.body.scrollHeight);
  }, []);

  const stars = useMemo(() => {
    return Array.from({ length: 700 }, (_, i) => {
      const top = Math.floor(Math.random() * pageHeight); // not just window.innerHeight
      const left = Math.floor(Math.random() * window.innerWidth);
      const duration = 2 + Math.random() * 3;
      const delay = Math.random() * 5;
      const size = Math.random() * 0.3+0.6;

      return (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${top}px`,
            left: `${left}px`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: "white",
            borderRadius: "9999px",
            animation: "twinkle 2s infinite ease-in-out",
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            opacity: 0.8,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      );
    });
  }, [pageHeight]); // recalculate if page height changes

  return <>{stars}</>;
};


const ChecklistForm = () => {
  const [form, setForm] = useState({
    SO: "",
    CorrectOrder: "",
    correctPO: "",
    correctshiptoaddress: "",
    shipDate: "",
    shipMethod: "FedEx Ground",
    shipVia: "Standard",
    specialins: "",
    checkStock: "NA",
    backorder: "NA",
    pricematch: "",
    logosize: "NA",
    bucketorder: "NA",
    ComponentArt: "",
    hangtags: "NA",
    colorpdf: "",
    oecsr: "OWAIZ",
  });

  type Tape = {
    prefix: string;
    code: string;
  };

  const [tapes, setTapes] = useState<Tape[]>([{ prefix: "", code: "" }]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleTapeChange = (
    index: number,
    field: keyof Tape,
    value: string
  ) => {
    const updated = [...tapes];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setTapes(updated);
  };

  const addTape = () => setTapes([...tapes, { prefix: "", code: "" }]);
  const removeTape = (index: number) => {
    const updated = tapes.filter((_, i) => i !== index);
    setTapes(updated);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = "Outsourcing OE Checklist – DOMESTIC";
    const titleWidth = doc.getTextWidth(title);
    const centerX = (pageWidth - titleWidth) / 2;
    doc.text(title, centerX, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`SO #: ${form.SO}`, 10, y);
    y += 10;
    doc.text("ORDER ENTRY", 10, y);
    y += 10;

    doc.text(`• Correct Order #: ${form.CorrectOrder}`, 10, y);
    y += 10;
    doc.text(`• Correct PO: ${form.correctPO}`, 10, y);
    y += 10;
    doc.text(`• Correct Ship to address: ${form.correctshiptoaddress}`, 10, y);
    y += 10;
    doc.text(`• Correct Ship Date: ${form.shipDate}`, 10, y);
    y += 10;
    doc.text(`• Correct Ship Method & Terms: ${form.shipMethod}`, 10, y);
    y += 10;
    doc.text(`• Shipping Via: ${form.shipVia}`, 10, y);
    y += 10;
    doc.text(`• Special Instructions: ${form.specialins}`, 10, y);
    y += 10;
    doc.text(`• Check available stock: ${form.checkStock}`, 10, y);
    y += 10;
    doc.text(
      `• Backorders are placed on separate SO: ${form.backorder}`,
      10,
      y
    );
    y += 10;
    doc.text(`• Price Matches ACE order copy: ${form.pricematch}`, 10, y);
    y += 10;

    doc.text(
      `• Correct tape/component: ${tapes
        .map((tape) => `${tape.prefix}${tape.code}`)
        .join(" / ")}`,
      10,
      y
    );
    y += 10;
    doc.text(`• Logo Size / Tolerance for Item: ${form.logosize}`, 10, y);
    y += 10;
    doc.text(`• Bucket order with band: ${form.bucketorder}`, 10, y);
    y += 10;
    doc.text(`• Component Art: ${form.ComponentArt}`, 10, y);
    y += 10;
    doc.text(`• Labels / Hang Tags: ${form.hangtags}`, 10, y);
    y += 10;
    doc.text(
      `• Color PDF/Component art uploaded to NetSuite: ${form.colorpdf}`,
      10,
      y
    );
    y += 10;
    doc.text(`* OE CSR ${form.oecsr}`, 10, y);
    doc.save(`Checklist CC# ${form.SO}.pdf`);

    // ✅ Reset the form after download
    setForm({
      SO: "",
      CorrectOrder: "",
      correctPO: "",
      correctshiptoaddress: "",
      shipDate: "",
      shipMethod: "FedEx Ground",
      shipVia: "Standard",
      specialins: "",
      checkStock: "NA",
      backorder: "NA",
      pricematch: "",
      logosize: "NA",
      bucketorder: "NA",
      ComponentArt: "",
      hangtags: "NA",
      colorpdf: "",
      oecsr: "OWAIZ",
    });

    setTapes([{ prefix: "", code: "" }]);
  };

  const fields = [
    { label: "SO #", id: "SO" },
    { label: "Correct Order #", id: "CorrectOrder" },
    { label: "Correct Ship Date", id: "shipDate", type: "date" },
    {
      label: "Shipping Methods & Terms",
      id: "shipMethod",
      type: "select",
      options: [
        "FedEx Ground",
        "UPS Ground",
        "Air Freight",
        "Best Method",
        "Consolidation",
        "Direct Ship",
        "FedEx 2Day",
        "FedEx International Connect Plus",
        "FedEx International Economy",
        "FedEx International Priority",
        "Fedex First Overnight",
        "Fedex One Rate",
        "Fedex Priority Overnight",
      ],
    },
    {
      label: "Shipping Via",
      id: "shipVia",
      type: "select",
      options: [
        "Standard",
        "Collect",
        "No Charge",
        "3rd Party",
        "Vendor Prepaid",
        "Flat UPS $1.00/unit",
        "Flat UPS $1.75/unit",
        "Flat UPS $.75/unit",
        "Flat UPS $2.00/unit",
        "Truck Standard",
        "Custom Rate",
        "Flat UPS $1.25/unit",
        "Flat FedEx $.75/unit",
        "Flat FedEx $1.00/unit",
        "Flat FedEx $1.25/unit",
        "Flat FedEx $1.75/unit",
        "Flat FedEx $2.00/unit",
        "Flat FedEx $.50/unit",
      ],
    },
    { label: "Correct PO", id: "correctPO" },
    { label: "Correct Ship to address", id: "correctshiptoaddress" },
    { label: "Special Instructions", id: "specialins", type: "select" },
    { label: "Check Available Stock", id: "checkStock", type: "select" },
    { label: "Backorders on Separate SO", id: "backorder", type: "select" },
    { label: "Price Match with ACE", id: "pricematch", type: "select" },
    { label: "Logo Size / Tolerance", id: "logosize", type: "select" },
    { label: "Bucket Order with Band", id: "bucketorder", type: "select" },
    { label: "Component Art", id: "ComponentArt", type: "select" },
    { label: "Labels / Hang Tags", id: "hangtags", type: "select" },
    {
      label: "Color PDF/Component art uploaded to NetSuite",
      id: "colorpdf",
      type: "select",
    },
    { label: "OE CSR", id: "oecsr", type: "select", options: ["OWAIZ"] },
  ];

  const renderField = (field: any) => (
    <div key={field.id} className="flex flex-col">
      <label htmlFor={field.id} className="text-sm font-medium mb-1">
        {field.label}
      </label>
      {field.type === "select" ? (
        <select
          id={field.id}
          value={(form as any)[field.id]}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
        >
          <option value="">-- Select --</option>
          {(field.options ?? ["YES", "NA"]).map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "date" ? (
        <DatePicker
          selected={
            (form as any)[field.id]
              ? new Date((form as any)[field.id])
              : null
          }
          onChange={(date) =>
            setForm((prev) => ({
              ...prev,
              [field.id]: date ? format(date, "MM-dd-yyyy") : "",
            }))
          }
          dateFormat="MM-dd-yyyy"
          placeholderText="Select Date"
          className="border border-gray-300 rounded p-2"
        />
      ) : (
        <input
          id={field.id}
          value={(form as any)[field.id]}
          onChange={handleChange}
          className="border border-gray-300 rounded p-2"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stars flex items-center justify-center p-4">
    <div className="nebula" />
    <div className="space-dust" />
<div className="planet" />
      <Stars />
    <div className=" relative z-10 w-full max-w-xl bg-white p-6 rounded-2xl shadow-2xl">
      
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          Outsourcing OE Checklist – DOMESTIC
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => {
            const fieldElement = renderField(field);

            if (field.id === "pricematch") {
              return (
                <>
                  {fieldElement}
                  <div className="md:col-span-2 mt-4">
                    <label className="font-semibold">
                      • Correct tape/component:
                    </label>
                    {tapes.map((tape, i) => (
                      <div key={i} className="flex gap-2 mt-2">
                        <select
                          value={tape.prefix}
                          onChange={(e) =>
                            handleTapeChange(i, "prefix", e.target.value)
                          }
                          className="border p-2 w-1/4 rounded"
                        >
                          <option value="">Prefix</option>
                          <option value="E">E</option>
                          <option value="3D">3D</option>
                          <option value="DTT">DTT</option>
                          <option value="EP">EP</option>
                        </select>
                        <input
                          type="text"
                          value={tape.code}
                          placeholder="Code"
                          onChange={(e) =>
                            handleTapeChange(i, "code", e.target.value)
                          }
                          className="border p-2 w-2/4 rounded"
                        />
                        {tapes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTape(i)}
                            className="text-red-500"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTape}
                      className="text-blue-600 mt-2"
                    >
                      ➕ Add Tape
                    </button>
                  </div>
                </>
              );
            }

            return fieldElement;
          })}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={generatePDF}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            📄 Download Checklist CC# {form.SO}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistForm;
