import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from "@/app/page.module.css";
import { UiLanguage } from "@/app/page";

export interface ParentAnalyticsChartProps {
    skillScores: Record<string, number>;
    language: UiLanguage;
    pickLanguageText: (lang: UiLanguage, vi: string, en: string) => string;
}

export function ParentAnalyticsChart({ skillScores, language, pickLanguageText }: ParentAnalyticsChartProps) {
    const data = Object.entries(skillScores).map(([subject, score]) => ({
        subject,
        score,
        fullMark: 100,
    }));

    if (data.length === 0) {
        return <p className={styles.chartEmpty}>{pickLanguageText(language, "Chưa đủ dữ liệu.", "Not enough data yet.")}</p>;
    }

    return (
        <div className={styles.radarChartContainer}>
            <h4 className={styles.chartTitle}>{pickLanguageText(language, "Hồ Sơ Kỹ Năng", "Skill Profile")}</h4>
            <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#ced4da" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#343a40', fontSize: 12, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Child" dataKey="score" stroke="#4c6ef5" strokeWidth={2} fill="#748ffc" fillOpacity={0.65} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
