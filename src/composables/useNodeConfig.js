// composables/useNodeConfig.js
import { ref } from 'vue'

export const useNodeConfig = () => {
  // 节点类型配置
  const nodeTypes = ref([
    {
      label: '病原体',
      value: 'pathogen',
      color: '#ff6b6b',
      icon: 'fas fa-virus',
    },
    {
      label: '感染部位',
      value: 'infection_site',
      color: '#4ecdc4',
      icon: 'fas fa-crosshairs',
    },
    {
      label: '临床症状',
      value: 'clinical_symptom',
      color: '#45b7d1',
      icon: 'fas fa-stethoscope',
    },
    {
      label: '诊断方法',
      value: 'diagnosis_method',
      color: '#96ceb4',
      icon: 'fas fa-search',
    },
    {
      label: '治疗方案',
      value: 'treatment_plan',
      color: '#ffeaa7',
      icon: 'fas fa-pills',
    },
    {
      label: '预防策略',
      value: 'prevention_strategy',
      color: '#dda0dd',
      icon: 'fas fa-shield-alt',
    },
    {
      label: '肝硬化阶段',
      value: 'cirrhosis_stage',
      color: '#98d8c8',
      icon: 'fas fa-layer-group',
    },
    {
      label: '并发症',
      value: 'complication',
      color: '#ff7675',
      icon: 'fas fa-exclamation-triangle',
    },
  ])

  // 关系类型配置
  const relationTypes = ref([
    { label: '致病', value: 'causes' },
    { label: '表现为', value: 'manifests_as' },
    { label: '诊断依据', value: 'diagnosed_by' },
    { label: '治疗方法', value: 'treated_with' },
    { label: '并发', value: 'complicates_with' },
    { label: '预防', value: 'prevented_by' },
    { label: '抗性', value: 'resistant_to' },
    { label: '协同作用', value: 'synergizes_with' },
    { label: '发生在', value: 'occurs_in' },
    { label: '关联', value: 'associated_with' },
  ])

  // 工具方法
  const getNodeConfig = (type) => {
    return (
      nodeTypes.value.find((node) => node.value === type) || {
        label: type,
        value: type,
        color: '#95a5a6',
        icon: 'fas fa-circle',
      }
    )
  }

  const getNodeColor = (type) => {
    return getNodeConfig(type).color
  }

  const getNodeLabel = (type) => {
    return getNodeConfig(type).label
  }

  const getNodeIcon = (type) => {
    return getNodeConfig(type).icon
  }

  const getRelationLabel = (type) => {
    const relation = relationTypes.value.find((rel) => rel.value === type)
    return relation ? relation.label : type
  }

  return {
    nodeTypes,
    relationTypes,
    getNodeConfig,
    getNodeColor,
    getNodeLabel,
    getNodeIcon,
    getRelationLabel,
  }
}
