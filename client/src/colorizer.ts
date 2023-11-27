// add type defs

const getColor = (node: any, markovState: any) => {

  const index = markovState.nodeToCommunicatingClassMap.get(node.id)

  const grayedConditions = [
    index === undefined,
    markovState.transientStates.includes(node.id),
  ]

  if (grayedConditions.some((condition) => condition)) {
    return ['Gray', 'border-gray-900']
  }

  const colors = [
    ['Red', 'border-red-500'],
    ['Orange', 'border-yellow-500'],
    ['Green', 'border-green-500'],
    ['Blue', 'border-blue-500'],
    ['Indigo', 'border-indigo-500'],
    ['Purple', 'border-purple-500'],
    ['Pink', 'border-pink-500'],
  ]

  return colors[index % colors.length]
}