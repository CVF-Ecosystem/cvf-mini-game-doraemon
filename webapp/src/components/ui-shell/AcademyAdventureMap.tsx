import React from "react";
import { AcademyProgressState, AcademyZoneState, AcademyNodeState } from "@/lib/progression-service";
import styles from "./AcademyAdventureMap.module.css";
import { UiLanguage } from "@/app/page";

export interface AcademyAdventureMapProps {
    academyProgress: AcademyProgressState;
    language: UiLanguage;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function AcademyAdventureMap({ academyProgress, language, pickLanguageText }: AcademyAdventureMapProps) {
    // Map data from progression state
    const { zones, activeZoneIndex, activeNodeIndex } = academyProgress;

    return (
        <div className={styles.mapContainer}>
            <div className={styles.mapHeader}>
                <h2 className={styles.mapTitle}>
                    {pickLanguageText(language, "Bản Đồ Phiêu Lưu", "Adventure Map")}
                </h2>
                <p className={styles.mapSubtitle}>
                    {pickLanguageText(language, "Khám phá các hành tinh tri thức!", "Explore planets of knowledge!")}
                </p>
            </div>

            <div className={styles.mapScrollWrapper}>
                <div className={styles.mapContent}>
                    {/* Render zones as planets/islands */}
                    {zones.map((zone, zIdx) => {
                        const isActiveZone = zIdx === activeZoneIndex;
                        const isPastZone = zIdx < activeZoneIndex;
                        
                        return (
                            <div 
                                key={zone.key} 
                                className={`${styles.zoneContainer} ${isActiveZone ? styles.zoneActive : ""} ${isPastZone ? styles.zoneCompleted : ""}`}
                            >
                                <div className={styles.zonePlanet}>
                                    <div className={styles.planetGraphics} data-zone={zone.key}>
                                        {/* Simple CSS planet */}
                                    </div>
                                    <div className={styles.zoneLabel}>
                                        {language === "vi" ? zone.titleVi : zone.titleEn}
                                    </div>
                                </div>

                                <div className={styles.nodesPath}>
                                    {zone.nodes.map((node, nIdx) => {
                                        const isCompleted = node.completed;
                                        const isCurrent = isActiveZone && nIdx === activeNodeIndex;
                                        
                                        return (
                                            <div key={node.id} className={styles.nodeWrapper}>
                                                <div 
                                                    className={`
                                                        ${styles.mapNode} 
                                                        ${isCompleted ? styles.nodeCompleted : ""} 
                                                        ${isCurrent ? styles.nodeCurrent : ""}
                                                    `}
                                                    title={language === "vi" ? node.labelVi : node.labelEn}
                                                >
                                                    {isCompleted ? "⭐" : isCurrent ? "📍" : "🔒"}
                                                </div>
                                                {/* Connecting line between nodes */}
                                                {(nIdx < zone.nodes.length - 1 || zIdx < zones.length - 1) && (
                                                    <div className={`${styles.pathLine} ${isCompleted ? styles.pathLineCompleted : ""}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
