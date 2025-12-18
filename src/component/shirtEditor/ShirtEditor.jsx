import React, { useState, useEffect, useRef } from "react";
import styles from "./shirtEditor.module.scss";
import Image from "next/image";

const ShirtEditor = ({ product }) => {
  const [text, setText] = useState(product?.presetText || "");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (product?.presetText) setText(product.presetText);
  }, [product]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      inputRef.current.setSelectionRange(text.length, text.length);
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const dynamicStyles = {
    color: product?.fontColor || "white",
    fontFamily: product?.fontFamily || "Summer Sunshine, sans-serif",
    fontSize: `${product?.fontSize || 28}px`,
  };

  return (
    <section className={styles.img_main_wrap}>
      <div className={styles.img_wrap}>
        <Image
          src={product?.canvasImage || "/placeholder.png"}
          alt="product"
          width={500}
          height={600}
          className={styles.mainImage}
          priority
        />

        {isEditing ? (
          <textarea
            ref={inputRef}
            className={`${styles.presetText} ${styles.editInput}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            placeholder="Your Text Here"
            style={dynamicStyles}
          />
        ) : (
          <div
            className={styles.presetText}
            onClick={() => setIsEditing(true)}
            style={dynamicStyles}
          >
            {text.trim() === "" ? "Your Text Here" : text}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShirtEditor;