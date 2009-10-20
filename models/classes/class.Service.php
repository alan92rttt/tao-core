<?php

error_reporting(E_ALL);

/**
 * The Service class is an abstraction of each service instance. 
 * Used to centralize the behavior related to every servcie instances.
 *
 * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
 * @package tao
 * @subpackage models_classes
 */

if (0 > version_compare(PHP_VERSION, '5')) {
    die('This file was generated for PHP 5');
}

/* user defined includes */
// section 10-13-1-45-792423e0:12398d13f24:-8000:0000000000001834-includes begin
// section 10-13-1-45-792423e0:12398d13f24:-8000:0000000000001834-includes end

/* user defined constants */
// section 10-13-1-45-792423e0:12398d13f24:-8000:0000000000001834-constants begin
// section 10-13-1-45-792423e0:12398d13f24:-8000:0000000000001834-constants end

/**
 * The Service class is an abstraction of each service instance. 
 * Used to centralize the behavior related to every servcie instances.
 *
 * @abstract
 * @access public
 * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
 * @package tao
 * @subpackage models_classes
 */
abstract class tao_models_classes_Service
{
    // --- ASSOCIATIONS ---


    // --- ATTRIBUTES ---

    /**
     * Short description of attribute ontologies
     *
     * @access protected
     * @var array
     */
    protected $ontologies = array('http://www.tao.lu/Ontologies/generis.rdf#','http://www.tao.lu/Ontologies/TAO.rdf#', 'http://www.tao.lu/datatypes/WidgetDefinitions.rdf#');

    // --- OPERATIONS ---

    /**
     * constructor
     *
     * @access public
     * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
     * @return void
     */
    public function __construct()
    {
        // section 10-13-1-45-792423e0:12398d13f24:-8000:000000000000183D begin
        // section 10-13-1-45-792423e0:12398d13f24:-8000:000000000000183D end
    }

    /**
     * Short description of method loadOntologies
     *
     * @access protected
     * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
     * @param  array ontologies
     * @return mixed
     */
    protected function loadOntologies($ontologies)
    {
        // section 127-0-1-1-266d5677:1246ba0ab68:-8000:0000000000001A9B begin
		
		$myOntologies = array_merge($this->ontologies, $ontologies);
		if(count($myOntologies) > 0){
			$session = core_kernel_classes_Session::singleton();
			foreach($myOntologies as $ontology){
				$session->model->loadModel($ontology);
			}
		}
		
        // section 127-0-1-1-266d5677:1246ba0ab68:-8000:0000000000001A9B end
    }

    /**
     * Short description of method getOneInstanceBy
     *
     * @access public
     * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
     * @param  Class clazz
     * @param  string identifier
     * @param  string mode
     * @param  boolean ignoreCase
     * @return core_kernel_classes_Resource
     */
    public function getOneInstanceBy( core_kernel_classes_Class $clazz, $identifier = '', $mode = 'uri', $ignoreCase = false)
    {
        $returnValue = null;

        // section 10-13-1-45--20a3dc13:1239ebd775d:-8000:00000000000018B6 begin
		($ignoreCase) ? $identifier = strtolower(trim($identifier)) : $identifier = trim($identifier);
		foreach($clazz->getInstances() as $resource){
			if( strlen($identifier) > 0 ){
				$comparator = false;
				switch ($mode){
					case 'uri'		: $comparator 	= $resource->uriResource; 	break;
					case 'label'	: $comparator 	= $resource->getLabel(); 	break;
					default : throw new Exception("Unsupported mode $mode");
				}
				if($ignoreCase){
					$comparator = strtolower($comparator);
				}
				
				if( $identifier == $comparator && $comparator !== false ){
					$returnValue = $resource;
					break;
				}
			}
		}
        // section 10-13-1-45--20a3dc13:1239ebd775d:-8000:00000000000018B6 end

        return $returnValue;
    }

    /**
     * Short description of method getPropertyByLabel
     *
     * @access public
     * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
     * @param  Class clazz
     * @param  string label
     * @return core_kernel_classes_Property
     */
    public function getPropertyByLabel( core_kernel_classes_Class $clazz, $label)
    {
        $returnValue = null;

        // section 10-13-1-45-2836570e:123bd13e69b:-8000:000000000000187B begin
		if(strlen(trim($label)) == 0){
			throw new Exception("Please, never use empty labels!");
		}
		foreach($clazz->getProperties()->getIterator() as $property){
			if($property->getLabel() == $label){
				$returnValue = $property;
				break;
			}
		}
        // section 10-13-1-45-2836570e:123bd13e69b:-8000:000000000000187B end

        return $returnValue;
    }

    /**
     * Short description of method createInstance
     *
     * @access public
     * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
     * @param  Class clazz
     * @param  string label
     * @return core_kernel_classes_Resource
     */
    public function createInstance( core_kernel_classes_Class $clazz, $label = '')
    {
        $returnValue = null;

        // section 10-13-1-45--135fece8:123b76cb3ff:-8000:0000000000001897 begin
		if( empty($label) ){
			$label = $clazz->getLabel() . '_' . (count($clazz->getInstances()) + 1);
		}
		$returnValue = core_kernel_classes_ResourceFactory::create(
			$clazz,
			$label,
			$label . ' created from ' . get_class($this) . ' the '. date('Y-m-d h:i:s') 
		);
        // section 10-13-1-45--135fece8:123b76cb3ff:-8000:0000000000001897 end

        return $returnValue;
    }

    /**
     * Short description of method bindProperties
     *
     * @access public
     * @author Bertrand Chevrier, <chevrier.bertrand@gmail.com>
     * @param  Resource instance
     * @param  array properties
     * @return core_kernel_classes_Resource
     */
    public function bindProperties( core_kernel_classes_Resource $instance, $properties = array())
    {
        $returnValue = null;

        // section 10-13-1-45--135fece8:123b76cb3ff:-8000:00000000000018A5 begin
		
		foreach($properties as $propertyUri => $propertyValue){
			
			$prop = new core_kernel_classes_Property( $propertyUri );
			$values = $instance->getPropertyValuesCollection($prop);
			if($values->count() > 0){
				if(is_array($propertyValue)){
					$instance->removePropertyValues($prop);
					foreach($propertyValue as $aPropertyValue){
						$instance->setPropertyValue(
							$prop,
							$aPropertyValue
						);
					}
				}
				else{
					$instance->editPropertyValues(
						$prop,
						$propertyValue
					);
				}
			}
			else{
				
				if(is_array($propertyValue)){
					foreach($propertyValue as $aPropertyValue){
						$instance->setPropertyValue(
							$prop,
							$aPropertyValue
						);
					}
				}
				else{
					$instance->setPropertyValue(
						$prop,
						$propertyValue
					);
				}
			}
		}
        $returnValue = $instance;
		
        // section 10-13-1-45--135fece8:123b76cb3ff:-8000:00000000000018A5 end

        return $returnValue;
    }

} /* end of abstract class tao_models_classes_Service */

?>